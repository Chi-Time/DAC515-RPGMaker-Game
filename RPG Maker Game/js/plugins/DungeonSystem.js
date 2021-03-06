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

//TODO: Make it so that if there are no dungeons present the game doesn't crash when trying to access the board.
(function () {

    /** Contains all dungeon map objects pre-loaded. */
    var dungeonMaps = [];

    /** Enum for hazard types. */
    var EHazards = {
        NEUTRAL: 0,
        PARALYZE: 1,
        BLIND: 2,
        POISON: 3,
        THUNDER: 4,
        ICE: 5,
        FIRE: 6,
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

    DungeonSystem._CurrentDungeonID = {};
    DungeonSystem._CurrentDungeonChoices = [];

    DungeonSystem.GetMapLocation = function (map)
    {
        if (map)
        {
            switch (map.Info.Location)
            {
                case ELocations.PLANES:
                return "Planes";
                case ELocations.FOREST:
                return "Forest";
                case ELocations.JUNGLE:
                return "Jungle";
                case ELocations.VOLCANO:
                return "Volcano";
                case ELocations.ICE:
                return "Ice";
                case ELocations.RUINS:
                return "Ruins";
                default:
                break; 
            }
        }

        return "N/A";
    };

    DungeonSystem.GetMapHazard = function (map)
    {
        if (map)
        {
            switch (map.Info.Hazard)
            {
                case EHazards.NEUTRAL:
                return "Neutral";
                case EHazards.PARALYZE:
                return "Paralyze";
                case EHazards.BLIND:
                return "Blind";
                case EHazards.POISON:
                return "Poison";
                case EHazards.THUNDER:
                return "Thunder";
                case EHazards.ICE:
                return "Ice";
                case EHazards.FIRE:
                return "Fire";
                default:
                break; 
            }
        }

        return "N/A";
    };

    /** Calculates the costs of moving to a dungeon.
     * @param {any} map The map object containing the map info and data to calculate from.
     * @returns {number} The amount that the trip will cost. */
    DungeonSystem.GetCost = function (map)
    {
        var cost = map.Info.Distance * getRandomFloatInRange (0.1, 0.9) * 100;
        cost *= $gameParty.members ().length;
        return Math.round (cost);
    };

    DungeonSystem.GetReward = function (map)
    {
        if (map)
        {
            var reward = getRandomIntInRange (map.Info.MinReward, map.Info.MaxReward);
            return reward;
        }

        return 0;
    };

    DungeonSystem.GetMapDifficulty = function (window, map)
    {
        if (map)
        {
            switch (map.Info.Difficulty)
            {
                case EDifficulty.WHITE:
                return "White";
                case EDifficulty.GREEN:
                return "Green";
                case EDifficulty.BLUE:
                return "Blue";
                case EDifficulty.PURPLE:
                return "Purple";
                case EDifficulty.ORANGE:
                return "Orange";
                default:
                break; 
            }
        }

        return "N/A";
    };

    DungeonSystem.GenerateDungeonChoices = function ()
    {
        // Reset data.
        this._CurrentDungeonChoices.length = 0;
        // Determine how many dungeons to display this time around.
        var amount = getRandomIntInRange(1, 4);

        console.log ("Amount to show: " + amount);

        for (var i = 0; i < amount; i++) 
        {
            // Get a random dungeon map.
            var map = dungeonMaps[getRandomIntInRange(0, dungeonMaps.length - 1)];

            // If the map is valid.
            if (map) 
            {
                // Determine if the map has been selected before.
                if (IsSameMap(map.Map.displayName)) 
                {
                    // If it has, let's loop again and pick one that hasn't.
                    i--;
                    continue;
                }

                // Setup map with values for travel cost and rewards.
                map.Info.Cost = this.GetCost (map);
                map.Info.Reward = this.GetReward (map);

                // If it hasn't, then push this map 
                this._CurrentDungeonChoices.push (map);
            }
        }
    };

    /** Determines if the given map is the same as one of the already picked choices.
     * @param {string} mapName The name of the map to test for.
     * @returns {boolean} Whether or not the map is the same.*/
    function IsSameMap (mapName)
    {
        for (var j = 0; j < DungeonSystem._CurrentDungeonChoices.length; j++) 
        {
            if (mapName === DungeonSystem._CurrentDungeonChoices[j].Map.displayName) 
            {
                console.log("Found same");
                return true;
            }
        }

        return false;
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () 
    {
        if (_DataManager_isDatabaseLoaded.call (this) === false) 
        {
            return false;
        }

        this.loadMaps ();

        console.log (dungeonMaps);

        return true;
    };

    /** Preloads map data into a dungeon maps holder. */
    DataManager.loadMaps = function () 
    {
        var mapInfos = loadJSONDataFromFile ("MapInfos");

        console.log (mapInfos);
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
                    for (var j = 0; j < mapInfos.length; j++)
                    {
                        if (mapInfos[j])
                        {
                            if (mapInfos[j].id === i) 
                            {
                                // Grab the data from the map's note and store this map into memory.
                                var mapObj = JSON.parse(mapData.note);
                                dungeonMaps.push ({Map: mapData, Info: mapObj, MapID: mapInfos[j].id});
                            }
                        }
                    }
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

        if (command === "ShowQuests")
        {
            DungeonSystem.GenerateDungeonChoices ();
            SceneManager.push (QuestBoard_Scene);
        }

        if (command === "FinishDungeon")
        {
            if (DungeonSystem._CurrentDungeonID)
            {
                var dungeon = null;
                for (var i = 0; i < DungeonSystem._CurrentDungeonChoices.length; i++)
                {
                    if (DungeonSystem._CurrentDungeonChoices[i].Map.displayName === DungeonSystem._CurrentDungeonID)
                    {
                        dungeon = DungeonSystem._CurrentDungeonChoices[i];
                    }
                }

                if (dungeon)
                {
                    $gameMessage.add("You have completed: " + dungeon.Map.displayName + "!");
                    $gameMessage.add("You've been awarded: " + dungeon.Info.Reward + " for your work.");
                    $gameParty.gainGold(dungeon.Info.Reward);
                }
            }
        }
    };

     /** Creates and sets up a craft window for selecting items to craft. */
     function QuestBoard_QuestWindow () {
        this.initialize.apply (this, arguments);
    }

    QuestBoard_QuestWindow.prototype = Object.create(Window_Selectable.prototype);
    QuestBoard_QuestWindow.prototype.constructor = QuestBoard_QuestWindow;

    QuestBoard_QuestWindow.lastTopRow = 0;
    QuestBoard_QuestWindow.lastIndex  = 0;

    QuestBoard_QuestWindow.prototype.initialize = function (x, y, height) {
        this._data = [];
        this._index = 0;
        var width = this.windowWidth ();
        Window_Selectable.prototype.initialize.call (this, x, y, width, height);
        this._dungeons = [];
        this.refresh ();
        this.setTopRow(QuestBoard_QuestWindow.lastTopRow);
        this.select(QuestBoard_QuestWindow.lastIndex);
    };

    QuestBoard_QuestWindow.prototype.windowWidth = function () {
        return 456;
    };

    QuestBoard_QuestWindow.prototype.item = function () {
        return this._data[this._index];
    };

    QuestBoard_QuestWindow.prototype.refresh = function () {
        this.makeItemList ();
        this.createContents();
        this.drawAllItems();
        this.setCursorFixed (false);
        this.setCursorAll (false);
        this.processCursorMove ();
    };

    QuestBoard_QuestWindow.prototype.setStatusWindow = function(statusWindow) {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    };

    QuestBoard_QuestWindow.prototype.makeItemList = function () 
    {
        // Reset the data.
        this._data.length = 0;

        // Loop through the dungeon choices.
        for (var i = 0; i < DungeonSystem._CurrentDungeonChoices.length; i++)
        {
            // Store the current map choice.
            this._data.push (DungeonSystem._CurrentDungeonChoices[i]);
        }
    };

    QuestBoard_QuestWindow.prototype.drawAllItems = function() {
        var topIndex = this.topIndex();

        for (var i = 0; i < this._data.length; i++)
        {
            var rect = this.itemRectForText(this._index);
            rect.width -= this.textPadding();
            this.drawText(this._data[i].Map.displayName, rect.x, i * 36, rect.width, "left");
        }
    };

    QuestBoard_QuestWindow.prototype.drawGivenItem = function (index) {
        var item = this._data[index];
        var rect = this.itemRect(index);
        rect.width -= this.textPadding ();
        this.drawITemName (item, rect.x, rect.y, rect.width - priceWidth);
    };

    QuestBoard_QuestWindow.prototype.updateHelp = function() {
        this._helpWindow.makeFontSmaller ();
        this._helpWindow.setText (this.item ().Info.Description);

        if (this._statusWindow) {
            this._statusWindow.setItem(this.item());
        }
    };

    QuestBoard_QuestWindow.prototype.maxCols = function(){
		return 1;
    };
    
    //NOTE: The cursor selection works thanks to this functions specifically.
    QuestBoard_QuestWindow.prototype.maxItems = function(){
		return this._data ? this._data.length : 0;
    };

    /** Creates and set's up a status window for crafting scenes. */
    function QuestBoard_StatusWindow () {
        this.initialize.apply (this, arguments);
    }

    /** Creates and sets up a status screen for the requirments of each item to craft. */
    QuestBoard_StatusWindow.prototype = Object.create(Window_Base.prototype);
    QuestBoard_StatusWindow.prototype.constructor = QuestBoard_StatusWindow;

    QuestBoard_StatusWindow.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call (this, x, y, width, height);
        this._item = null;
        this._pageIndex = 0;
        this.refresh ();
    };

    QuestBoard_StatusWindow.prototype.refresh = function () {
        this.contents.clear ();
    };

    QuestBoard_StatusWindow.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    QuestBoard_StatusWindow.prototype.refresh = function() {
        var item = this._item;

        if (item)
        {
            this.contents.clear ();
            this.makeFontSmaller ();
            this.drawText ("Enemies Needed: " + item.Info.EnemiesToKill, 0, 0, 400, "left");
            this.drawText ("Location: " + DungeonSystem.GetMapLocation (item), 0, 36, 400, "left");
            this.drawText ("Travel Cost: " + item.Info.Cost, 0, 72, 400, "left");
            this.drawText ("Hazards: " + DungeonSystem.GetMapHazard (item), 0, 108, 400, "left");
            this.drawText ("Reward: " + item.Info.Reward, 0, 144, 400, "left");
            //TODO: Figure out how to color specific difficulty text.
            this.drawText ("Difficulty: " + DungeonSystem.GetMapDifficulty (this, item), 0, 180, 400, "left");
        }
    };

    /** Creates and displays the quest board scene to the user. */
    function QuestBoard_Scene () {
        this.initialize.apply (this, arguments);
    }

    QuestBoard_Scene.prototype = Object.create (Scene_MenuBase.prototype);
    QuestBoard_Scene.prototype.constructor = QuestBoard_Scene;

    QuestBoard_Scene.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call (this);
    };

    QuestBoard_Scene.prototype.create = function () {
        Scene_MenuBase.prototype.create.call (this);

        this.createHelpWindow ();
        this.createQuestWindow ();
        this.createQuestStatusWindow ();
        this._questWindow.setStatusWindow (this._statusWindow);
        this._questWindow.setHandler ('ok',     this.onOk.bind (this));
        this._questWindow.setHandler ('cancel', this.onCancel.bind(this));
    };

    //NOTE: USE THIS TO HANDLE ALL SELECTIONS WITHIN THE WINDOW AND DISPLAY RELEVENT THINGS BASED ON THEM.
    QuestBoard_Scene.prototype.onOk = function ()
    {
        var item = this._questWindow.item ();

        if (item) 
        {
            for (var i = 0; i < item.Map.events.length; i++) 
            {
                if (item.Map.events[i]) 
                {
                    if (item.Map.events[i].note === "Spawn") 
                    {
                        if ($gameParty.gold () >= item.Info.Cost)
                        {
                            DungeonSystem._CurrentDungeonID = item.Map.displayName;
                            this.onCancel ();
                            $gameParty.loseGold (item.Info.Cost);
                            $gamePlayer.reserveTransfer(item.MapID, item.Map.events[i].x, item.Map.events[i].y, 0, 0);

                            return;
                        }

                        //TODO: Figure out how to play buzzer sound when not accepting input.
                        this.onCancel ();
                        $gameMessage.add ("Not enough gold for that dungeon");
                    }
                    //TODO: Make function which checks if a map has a spawn event inside of it.
                }
            }
        }

        if (item === "Cancel")
        {
            this.onCancel ();
            return;
        }
    };

    QuestBoard_Scene.prototype.onCancel = function()
    {
        this._questWindow.hide();
        this._statusWindow.hide();
        this._helpWindow.clear();
        this._helpWindow.hide();
        this.popScene();
    };

    QuestBoard_Scene.prototype.createHelpWindow = function ()
    {
        this._helpWindow = new Window_Help (3);
        this._helpWindow.y = Graphics.height - this._helpWindow.height;
        this.addWindow (this._helpWindow);
    };

    QuestBoard_Scene.prototype.createQuestWindow = function ()
    {
        this._questWindow = new QuestBoard_QuestWindow (0, 0, 300);
        this._questWindow.height = this._helpWindow.y;
        this._questWindow.setHelpWindow (this._helpWindow);
        this.addWindow (this._questWindow);
    };

    QuestBoard_Scene.prototype.createQuestStatusWindow = function ()
    {
        this._statusWindow = new QuestBoard_StatusWindow (500, 0, 360, 300);
        this._statusWindow.x = this._questWindow.windowWidth();
        this._statusWindow.height = this._helpWindow.y;
        this.addWindow(this._statusWindow);
        this._questWindow.activate ();
    };

})();
