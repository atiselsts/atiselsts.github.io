/**
 * Copyright 2013 IBM Corp.
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
RED.options = function() {

    var options = {
        // 8 SPES-2: 320
        // 5 SPG-2: 200 (total 520)
        // 4 SPW-2: 200 (total 720)
        // 4 NUC: 480 (total 1200)
        // 3 cameras: 240 (total 1440)
        // 2 water sensors: 40 (total 1460)
        startingCredits: 1500,

        // in pixels
        roomBoundary : 30,

        distanceMetersToPixels : 50,
    };

    var allProtocols = [
        { nm: "TSCH",
          name : "Time Slotted Channel Hopping (TSCH)",
          color: "#388e3c",
          range : 10 * options.distanceMetersToPixels,
        },
        {
            nm: "BLE",
            name : "Bluetooth Low Energy (BLE)",
            color: "#bf360c",
            range : 7 * options.distanceMetersToPixels,
        },
        {
            nm: "USB",
            name : "USB cable",
            color: "#666",
            // XXX: in reality this is 5 meters, but set to 3 to make the
            // devices seem to be more physically co-located
            range : 3 * options.distanceMetersToPixels,
        },
        {
            nm: "433 MHz",
            name : "433 MHz wireless",
            color: "#dddddd",
            range : 20 * options.distanceMetersToPixels,
        },
        {
            nm: "PLC",
            name : "Power Line Comunications (PLC)",
            color: "#dddddd",
            range : 10 * options.distanceMetersToPixels, // TODO: what to use here?
        },
        {
            nm: "WiFi",
            name : "WiFi (5 GHz)",
            color: "#ffa043",
            // XXX: should be shorter to force using PLC?
            range : 15 * options.distanceMetersToPixels //8 * distanceMetersToPixels,
        },
        {
            nm: "3G",
            name : "3G (cellular connection)",
            color: "#ffa043",
            range : 100 * options.distanceMetersToPixels
        },
    ];

    function getOption(name) {
        return options[name];
    }

    return {
        getProtocols: function () { return allProtocols; },
        getProtocolByName: function (nm) {
            var i;
            for (i = 0; i < allProtocols.length; ++i) {
                if (allProtocols[i].nm === nm) {
                    return allProtocols[i];
                }
            }
            return null;
        },
        getOption : getOption
    }
}();
