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
RED.suggestions = function() {

    var suggestions = [];
    var problems = [];

    function hasNodes() {
        return RED.nodes.nodes.length ? true : false;
    }

    function hasLinks() {
        return RED.nodes.links.length ? true : false;
    }

    function hasSHG() {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (node._def.isHomeGateway === true) {
                has = true;
            }
        });
        return has;
    }

    function hasAnySensors() {
        return hasSensors("environmental") || hasSensors("wearable") || hasSensors("video");
    }

    function hasSensors(modality) {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (node._def.modality === modality) {
                has = true;
            }
        });
        return has;
    }

    function hasReachableSensors(modality) {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (node.isReachable && node._def.modality === modality) {
                has = true;
            }
        });
        return has;
    }

    function sensingInRoom(modality, room) {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (node.isReachable && node._def.modality === modality) {
                if (node.rooms && node.rooms.indexOf(room) !== -1) {
                    has = true;
                }
            }
        });
        return has;
    }

    // -----------------------------------------------------------------------

    suggestions.push({
        predicate : hasNodes,
        text : "Try dragging some nodes from the palette to the house floorplan to get started"
    });

    suggestions.push({
        predicate : hasLinks,
        text : "Join the nodes together with links to get started.\nA link must connect an <strong>output port</strong> (right side) of a node with an <strong>input port</strong> (left side) of another node"
    });

    suggestions.push({
        predicate : hasSHG,
        text : "A smart home system needs a <strong>home gateway</strong>"
    });

    suggestions.push({
        predicate : hasAnySensors,
        text : "A smart home system needs <strong>sensors</strong> for data collection"
    });

    suggestions.push({
        predicate : function() { return hasSensors("environmental") },
        text : "A smart home system needs <strong>environmental sensors</strong> to capture ambient information about the rooms"
    });

    suggestions.push({
        predicate : function() { return hasSensors("wearable") },
        text : "A smart home system needs <strong>a wristband sensor</strong> (a \"wearable\") to capture participant activities and localize participants in the house"
    });

    suggestions.push({
        predicate : function() { return hasSensors("video") },
        text : "A smart home system needs <strong>video sensors</strong> to capture participant activities and information about their quality of movement"
    });
   
    suggestions.push({
        predicate : function() { return hasSensors("gateway") },
        text : "Adding <strong>forwarding gateways</strong> to the system is necessary to collect information from the wristband sensors; it also helps to increase the coverage in parts of the house remote from the Home Gateway"
    });
        
    suggestions.push({
        predicate : function() { return hasReachableSensors("environmental") },
        text : "Environmental sensors need to be able to reach the Home Gateway"
    });

    suggestions.push({
        predicate : function() { return hasReachableSensors("video") },
        text : "Information extracted from raw video need to be able to reach the Home Gateway"
    });

    suggestions.push({
        predicate : function() { return hasReachableSensors("gateway") },
        text : "Information from wristband devices need to be able to reach the Home Gateway"
    });

    suggestions.push({
        predicate : function() { return sensingInRoom("video", "hall-and-stairs") },
        text : "A connected video sensor in the hall helps to detect movement quality, especially about participants moving up and down the stairs. This is useful to monitor the recovery of patients after hip or knee operations and diagnose the severity of problems such as Parkinson's disease"
    });

    suggestions.push({
        predicate : function() { return sensingInRoom("video", "kitchen") },
        text : "A connected video sensor in the kitchen helps to detect cooking-related activities. This is useful to diagnose the complexity and duration of means, which is useful for many medical applications, including monitoring and early diagnosis of Alzheimer's disease"
    });

    suggestions.push({
        predicate : function() { return sensingInRoom("video", "living room") },
        text : "A connected video sensor in the living room records a lot of infromation about activities, such as the time spent watching TV"
    });

    suggestions.push({
        predicate : function() {
            return sensingInRoom("gateway", "guest bedroom") || sensingInRoom("gateway", "master bedroom")
        },
        text : "A connected Forwarding Gateway in the bedroom is useful to record information about sleep quality during night, assuming a wristband node is worn by the particant sleeping there. Bad sleep quality is correlated and may increase the risk of many medical conditions, including depressing and hypertension"
    });

    // -----------------------------------------------------------------------

    function hasSensorIn(modality, room) {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (node._def.modality === modality) {
                if (node.rooms && node.rooms.indexOf(room) !== -1) {
                    has = true;
                }
            }
        });
        return has;
    }

    function hasUnreachableSensors(modality) {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (!node.isReachable && node._def.modality === modality) {
                has = true;
            }
        });
        return has;          
    }

    function hasDisconnectedSensors(modality) {
        var has = false;
        RED.nodes.eachNode(function (node) {
            if (!node.isReachable && node._def.modality === modality) {
                var wires = RED.nodes.links.filter(function(d){return d.source === node});
                if (!wires || !wires.length) {
                    // this node has no links
                    has = true;
                }
            }
        });
        return has;
    }

    function numberOfSensors(modality) {
        var count = 0;
        RED.nodes.eachNode(function (node) {
            if (node._def.modality === modality) {
                count++;
            }
        });
        return count;
    }

    problems.push({
        predicate : function() {
            return hasSensorIn("video", "master bedroom")
                || hasSensorIn("video", "guest bedroom")
        },
        text : "Video monitoring in bedrooms could be seen as a severe violation of participant privacy"
    });

    problems.push({
        predicate : function() { return hasSensorIn("video", "toilet") },
        text : "Video monitoring in the toilet could be seen as a severe violation of participant privacy"
    });

    problems.push({
        predicate : function() { return hasSensorIn("video", "bathroom") },
        text : "Video monitoring in the bathroom could be seen as a severe violation of participant privacy"
    });

    problems.push({
        predicate : function() { return hasUnreachableSensors("gateway") },
        text : "There is a disconnected forwarding gateway. All forwarding gateways need to be able to communicate with the Home Gateway either directly or, for most of them, through another forwarding gateway"
    });

    problems.push({
        predicate : function() { return hasDisconnectedSensors("environmental") },
        text : "There is a disconnected environmental sensor. All environmental sensors need to be able to communicate with the Home Gateway through forwarding gateways"
    });

    problems.push({
        predicate : function() { return hasUnreachableSensors("environmental") },
        text : "There is an unreachable environmental sensor. All environmental sensors need to be able to communicate with the Home Gateway through a forwarding gateway"
    });

    problems.push({
        predicate : function() { return hasDisconnectedSensors("video") },
        text : "There is a disconnected video camera. Each video camera needs to be connected to a video gateway with a USB cable"
    });

    problems.push({
        predicate : function() { return hasUnreachableSensors("video") },
        text : "There is an unreachable video camera. All video cameras need to be able to communicate with the Home Gateway through a video gateway"
    });

    problems.push({
        predicate : function() { return numberOfSensors("video") > 3 },
        text : "More than three video cameras <i>may</i> make you run out of budget too soon if you're not careful"
    });

    // TODO: video camera directly to the home gateway

    // TODO: wrong protocols?

    // -----------------------------------------------------------------------

    function getSuggestion()
    {
        if (!RED.game.getIsStarted()) {
            // game not started yet
            return { type: "Suggestion", text : "Wait for the game to load.." }; // sic: this needs *two* dots!
        }

        if (Math.random() < 0.5) {
            // look at problems first
            for (var i = 0; i < problems.length; i++) {
                if (problems[i].predicate()) {
                    //if (i !== problems.length - 1 && Math.random() < 0.5) {
                    //    continue;
                    //}
                    return { type: "Problem", text : problems[i].text };
                }
            }
        }

        var anySkipped = false;
        for (var j = 0; j < 2; j++) {
            for (var i = 0; i < suggestions.length; i++) {
                if (!suggestions[i].predicate()) {
                    // TODO: is the randomization sensible?
                    if (j === 0 && i !== suggestions.length - 1 && Math.random() < 0.5) {
                        anySkipped = true;
                        continue; // skip this one randomly
                    }
                    return { type: "Suggestion", text : suggestions[i].text };
                }
            }
            if (!anySkipped) {
                break;
            }
        }

        return { type : "Suggestion",
                 text : 'Looks like you\'re all done with the "basic" stuff. Keep up the good work!<br><br>Some ideas to try out:<ul><li> What\'s the minimal number of devices needed to achieve full coverage?<li> If you\'re using BLE for communication, try switcing the network to TSCH and vice versa.<li>Indoor localization relies on Forwarding Gateways: the more, the better.<li> Leave <a href="#" onclick="$(\'#node-dialog-about\').modal()">feedback via social media or email!</a></ul>'
               }
    }
    
    return {
        get : getSuggestion
    };

}();
