/*:
 * @plugindesc Adds a dungeon random selection system for curating dungeon choices.
 * @author James Johnson
 *
 * @help This plugin contains several plugin commands.
 */

 /** Loads JSON data from a given file found within the Data folder of the RPGM project.
  * @param filename The name of the file to grab the contents of. */
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
     * @param number The current map number to grab the file of. */
    DataManager.getFormattedName = function (number)
    {
        if (number <= 9)
            return "00" + number;
        else if (number > 9)
            return "0" + number;
        else
            return number;
    }

})();
