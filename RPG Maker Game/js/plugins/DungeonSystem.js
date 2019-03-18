/*:
 * @plugindesc Adds a dungeon random selection system for curating dungeon choices.
 * @author James Johnson
 *
 * @help This plugin contains several plugin commands.
 */

 /** Loads JSON data from a given file found within the Data folder of the RPGM project.
  * @param {string} filename The name of the file to grab the contents of. 
  * @returns {any} The parsed JSON object or null if not parsable. */
function loadJSONDataFromFile(filename) 
{ 
    var fs = require('fs');
    var dir = window.location.pathname.replace(/(\/www|)\/[^\/]*$/, '/');
    
    if (dir.match(/^\/([A-Z]\:)/))
    {
        dir = dir.slice(1);
    }
    
    filename = decodeURIComponent(dir) + 'data/' + filename + '.json';

    if (fs.existsSync (filename))
    {
        return JsonEx.parse(fs.readFileSync(filename, 'utf8'));
    }

    return null;
};

(function () {

    /** Contains all dungeon map objects pre-loaded. */
    var dungeonMaps = [];
    var dungeonChoices = [];

    /** Enum for hazard types. */
    var EHazards = {
        Neutral: 0,
        Paralyze: 1,
        Blind: 2,
        Poison: 3,
        Thunder: 4,
        Ice: 5,
        Fire: 6,
    };

    /** Enum for difficulty ratings. */
    var EDifficulty = {
        WHITE: 0,
        GREEN: 1,
        BLUE: 2, 
        PURPLE: 3,
        ORANGE: 4
    };

    /** Enum for different in game locations. */
    var ELocations = {
         PLANES: 0,
         FOREST: 1,
         JUNGLE: 2,
         VOLCANO: 3,
         ICE: 4,
         RUINS: 5
    };

    /** Static class for interacting with the dungeon system. */
    function DungeonSystem ()
    {
        throw new Error ("This is a static class");
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () 
    {
        if (_DataManager_isDatabaseLoaded.call (this) === false) 
        {
            return false;
        }

        this.loadMaps ();

        return true;
    };

    /** Preloads map data into a dungeon maps holder. */
    DataManager.loadMaps = function () 
    {
        // Check up to  maximum of 250 maps.
        for (var i = 0; i < 250; i++)
        {
            // Grab the data of the current map file.
            var mapData = loadJSONDataFromFile ("Map" + this.getFormattedName (i));

            // Is this map valid?
            if (mapData)
            {
                // Does it have a note?
                if (mapData.note)
                {
                    // Grab the data from the map's note and store this map into memory.
                    var mapObj = JSON.parse(mapData.note);
                    dungeonMaps.push ({Map: mapData, Info: mapObj});
                }
            }
        }
    };

    /** Returns a pre-formatted name for map files from the given number. 
     * @param {number} number The current map number to grab the file of. */
    DataManager.getFormattedName = function (number)
    {
        if (number <= 9)
            return "00" + number;
        else if (number > 9)
            return "0" + number;
        else
            return number;
    }

    var _Game_Interpreter_PlugingCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) 
    {
        _Game_Interpreter_PlugingCommand.call(this, command, args);

        if (command === "ShowDungeons")
        {
            var amount = getRandomIntInRange (1, 4);
            dungeonChoices.length = 0;

            for (var i = 0; i < amount; i++)
            {
                var map = dungeonMaps[getRandomIntInRange (0, dungeonMaps.length - 1)];

                if (map)
                {
                    if (IsSameMap (map.Map.displayName))
                    {
                        i--;
                        continue;
                    }

                    dungeonChoices.push (map.Map.displayName);
                }
            }

            dungeonChoices.push ("Cancel");
            $gameMessage.setChoices (dungeonChoices, 0, dungeonChoices.length - 1);
            $gameMessage.add ("hey");
            $gameMessage.setChoiceCallback (this.testCallback.bind (this));
        }
    };

    /** Determines if the given map is the same as one of the already picked choices.
     * @param {string} mapName The name of the map to test for.
     * @returns {boolean} Whether or not the map is the same.*/
    function IsSameMap (mapName)
    {
        for (var j = 0; j < dungeonChoices.length; j++) 
        {
            if (mapName === dungeonChoices[j]) 
            {
                console.log("Found same");
                return true;
            }
        }

        return false;
    };

    //TODO: Document and refactor this method.
    Game_Interpreter.prototype.testCallback = function (number)
    {
        var map = null;
        if (number === dungeonChoices.length - 1)
        {
            // console.log ("Cancel: " + number);
            return;
        }

        for (var i = 0; i < dungeonMaps.length; i++)
        {
            // console.log ("Running through maps");
            // console.log (number);
            //console.log (dungeonMaps[i].Map.displayName + " " + dungeonChoices[number]);
            if (dungeonMaps[i].Map.displayName === dungeonChoices[number])
            {
                //console.log ("Found a matching map.")
                for (var j = 0; j < dungeonMaps[i].Map.events.length; j++)
                {
                    //console.log ("Running through map events");
                    if (dungeonMaps[i].Map.events[j])
                    {
                        //console.log (dungeonMaps[i].Map.events[j]);
                        if (dungeonMaps[i].Map.events[j].note === "Spawn")
                        {
                            // console.log ("Yeah");
                            // console.log ("This dungeon costs: " + GetCost (dungeonMaps[i]));
                            $gamePlayer.reserveTransfer(dungeonMaps[i].Map.mapId, dungeonMaps[i].Map.events[j].x, dungeonMaps[i].Map.events[j].y, 0, 0);
                            
                        }
                        //TODO: Make function which checks if a map has a spawn event inside of it.
                    }
                }
            }
        }

        console.log ("Awesome: " + number);
    };

    /** Calculates the costs of moving to a dungeon.
     * @param {any} map The map object containing the map info and data to calculate from.
     * @returns {number} The amount that the trip will cost. */
    function GetCost (map)
    {
        var cost = map.Info.Distance * getRandomFloatInRange (0.1, 0.9) * 100;
        cost *= $gameParty.members ().length;
        return Math.round (cost);
    };

})();
