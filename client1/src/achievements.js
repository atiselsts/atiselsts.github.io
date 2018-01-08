/**
 * Copyright 2018 University of Bristol
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
"use strict";
RED.achievements = function() {

    function anyCoverage(modality, hasToBeReachable) {
        //console.log("checking " + modality + " coverage...");

        var any = null;
        RED.nodes.eachNode(function (n) {
            if (n.isReachable || !hasToBeReachable) {
                if (n._def.modality === modality) {
                    // found a satisfactory node
                    any = n;
                }
            }
        });
        return any;
    }

    function coverageInRoom(modality, room, hasToBeReachable) {
        var result = null;
        RED.nodes.eachNode(function (n) {
            if (n.isReachable || !hasToBeReachable) {
                if (n._def.modality === modality) {
                    // found a satisfactory node
                    if (n.rooms && n.rooms.indexOf(room) !== -1) {
                        result = n;
                    }
                }
            }
        });
        return result;

    }

    function fullEnvironmentalCoverage() {
        // the coverage is full is there is connected sensor in every room

        var rooms = RED.game.getRoomNames();
        var presentRooms = [];

        RED.nodes.eachNode(function (n) {
            if (n._def.modality === "environmental" && n.isReachable) {
                n.rooms.forEach(function (r) {
                    if (presentRooms.indexOf(r) === -1) {
                        presentRooms.push(r);
                    }
                });
            }
        });

        if (rooms.length) {
            var c = Math.min(1, presentRooms.length / rooms.length);
            RED.game.setCoverage("environmental", Math.round(100 * c));
        } else {
            RED.game.setCoverage("environmental", 0);
        }

        return (presentRooms.length >= rooms.length);
    }

    function wearableCoverageStats() {
        // the coverage is full is there is connected gateway in every two rooms,
        // as well as at least one wearable is present

        var result = {
            rooms: RED.game.getRoomNames(),
            presentRooms: [],
            hasWearable: false,
            numGw: 0
        }

        RED.nodes.eachNode(function (n) {
            if (n._def.modality === "wearable") {
                result.hasWearable = true;
            }
            else if (n._def.modality === "gateway") {
                result.numGw += 1;
                if (n.isReachable) {
                    n.rooms.forEach(function (r) {
                        if (result.presentRooms.indexOf(r) === -1) {
                            result.presentRooms.push(r);
                        }
                    });
                }
            }
        });

        return result;
    }

    function fullWearableCoverage() {
        var stats = wearableCoverageStats();

        if (stats.rooms.length) {
            var c = stats.hasWearable ? Math.min(1, 2 * stats.presentRooms.length / stats.rooms.length) : 0;
            RED.game.setCoverage("wearable", Math.round(100 * c));
        } else {
            RED.game.setCoverage("wearable", 0);
        }

        return stats.hasWearable && 2 * stats.presentRooms.length >= stats.rooms.length;
    }

    function fullVideoCoverage() {
        // the coverage is full is there are connected video cameras in all of:
        //  - hall
        //  - kitchen,
        //  - living room.

        var hasCamera = {
            "hall-and-stairs" : false,
            "kitchen" : false,
            "living room" : false
        };

        RED.nodes.eachNode(function (n) {
            if (n._def.modality === "video" && n.isReachable) {
                n.rooms.forEach(function (r) {
                    hasCamera[r] = true;
                });
            }
        });

        var c = 0;
        if (hasCamera["hall-and-stairs"]) c++;
        if (hasCamera["kitchen"]) c++;
        if (hasCamera["living room"]) c++;

        RED.game.setCoverage("video", Math.round(100 * c / 3));

        return c >= 3;
    }

    function wholeEmbeddedNetwork(protocol) {
        // TODO!
        return false;
    }

    function systemMonitoring() {
        // simply: a router exists and is reachable
        return anyCoverage("3G", true);
    }

    function sleepMonitoring() {
        var stats = wearableCoverageStats();
        var inBedroom = false;
        if (stats.rooms.length) {
            if (stats.presentRooms.indexOf("guest bedroom") !== -1
                || stats.presentRooms.indexOf("master bedroom") !== -1) {
                inBedroom = true;
            }
        }
        return stats.hasWearable && inBedroom;
    }

    function indoorLocalization() {
        var stats = wearableCoverageStats();
        return stats.hasWearable && stats.presentRooms.length >= stats.rooms.length;
    }

    // covers all with 2 forwarding gateways
    function isMinimalist() {
        var stats = wearableCoverageStats();
        return stats.numGw <= 2 && stats.hasWearable && 2 * stats.presentRooms.length >= stats.rooms.length;
    }

    function isWaterSensor(room) {
        return coverageInRoom("water", room, true);
    }

    // -----------------------------------------------------

    var achievements = [];

    achievements.push({
        name: "Environmental sensing",
        explanation : "You have collected the first data from an environmental sensor",
        predicate:  function() { return  anyCoverage("environmental", true)}
    });
    achievements.push({
        name: "Wearable sensing",
        explanation : "You have collected the first data from a wristband sensor",
        predicate: function() { return anyCoverage("wearable", false)
                                && anyCoverage("gateway", true);}
    });
    achievements.push({
        name: "Video sensing",
        explanation : "You have collected first information extracted from video data",
        predicate: function() { return anyCoverage("video", true)}
    });

    achievements.push({
        name: "Full environmental sensing",
        explanation : "You have fully covered the house with environmental sensors",
        predicate: fullEnvironmentalCoverage
    });

    achievements.push({
        name: "Full wearable sensing",
        explanation : "You have fully covered the house with devices picking up data from wristband (wearable) sensors (at least one for each two rooms)",
        predicate: fullWearableCoverage
    });
    achievements.push({
        name: "Full video sensing",
        explanation : "You have installed video sensors in the hall, kitchen, and living room, the main areas of interest for video sensing",
        predicate: fullVideoCoverage
    });

    achievements.push({
        name: "System monitoring",
        explanation : "You have installed a monitoring service over a 3G mobile connection. This will allow to schedule maintenance visits if some of the components stop working or otherwise break down",
        predicate:  systemMonitoring
    });

    achievements.push({
        name: "Sleep monitoring",
        explanation : "You have installed a Wristband Sensor and a Forwarding Gateway in a bedroom. This will allow to monitor the activity levels during sleep.",
        predicate:  sleepMonitoring
    });

    // ------------------------------------------------------------------

    achievements.push({
        name: "TSCH network",
        explanation : "You have connected all embedded sensing and forwarding devices in a TSCH network",
        predicate: function() { return wholeEmbeddedNetwork("TSCH")},
        isHidden: true
    });

    achievements.push({
        name: "BLE network",
        explanation : "You have connected all embedded sensing and forwarding devices in a BLE network",
        predicate:  function() { return wholeEmbeddedNetwork("BLE")},
        isHidden: true
    });

    achievements.push({
        name: "Minimalist",
        explanation : "You have covered the whole house with just two Forwarding Gateways.<br><br>Note that while this is cost-efficient in the short term, adding some redundancy is usually a better option that helps to avoid losing data even after some devices break down",
        predicate:  isMinimalist,
        isHidden: true
    });

    achievements.push({
        name: "Indoor localization",
        explanation : "You have installed Forwading Gateways in sufficiently many rooms. This will allow to accurately track the location of wristband sensor users. From healthcare perspecitive, increasingly stationary lifestyle may signal detoriation",
        predicate:  indoorLocalization,
        isHidden: true
    });

    achievements.push({
        name: "Water monitoring: kitchen",
        explanation : "You have installed a Water Sensor in kitchen. Food preparation and water concumption habits are highly correlated with long-term health outcomes",
        predicate:  function() { return isWaterSensor("kitchen")},
        isHidden: true
    });

    achievements.push({
        name: "Water monitoring: bathroom",
        explanation : "You have installed a Water Sensor in bathroom. It may be helpful to know the showering frequency and duration for the energy bill",
        predicate:  function() { return isWaterSensor("bathroom")},
        isHidden: true
    });

    achievements.push({
        name: "Water monitoring: toilet",
        explanation : "You have installed a Water Sensor in toilet. Frequency of its usage may be correlated with health",
        predicate:  function() { return isWaterSensor("toilet")},
        isHidden: true
    });

    // ------------------------------------------------------------------

    // get info about achievements from the local storage in the web browaser (persistent info)
    var doneAchievements;

    var daString = localStorage.getItem("doneAchievements") || "[]";
    try {
        doneAchievements = JSON.parse(daString);
    } catch(error) {
        doneAchievements = [];
    }

    function isDone(name) {
        return doneAchievements.indexOf(name) !== -1;
    }

    return {
        get : function() { return achievements; },
        findByName : function(name) {
            var i;
            for (i = 0; i < achievements.length; ++i) {
                if (achievements[i].name === name) {
                    return achievements[i];
                }
            }
            return null;
        },
        setDone : function (name) {
            if(doneAchievements.indexOf(name) === -1) {
                doneAchievements.push(name);
                localStorage.setItem("doneAchievements", JSON.stringify(doneAchievements));
            }
        },
        isDone : isDone,
        getDone : function () {
            return doneAchievements;
        },
        getAll : function () {
            var result = [[], []];
            var i;
            for (i = 0; i < achievements.length; ++i) {
                if (isDone(achievements[i].name)) {
                    result[0].push(achievements[i].name);
                } else {
                    result[1].push(achievements[i].isHidden ? "Hidden achievement" : achievements[i].name);
                }
            }
            return result;
        },
        reset : function () {
            doneAchievements = [];
            localStorage.setItem("doneAchievements", "[]");
            localStorage.setItem("hasShownIntro", "");
        }
    };

}();
