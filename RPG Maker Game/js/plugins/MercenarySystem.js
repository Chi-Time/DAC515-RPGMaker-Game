/*:
 * @plugindesc Adds a dungeon random selection system for curating dungeon choices.
 * @author James Johnson
 *
 * @help This plugin contains several plugin commands.
 */

//NOTE: Use this to access the actor you need.
//$gameActors.actor (mercPool[0].Actor.id))

//TODO: Make it so that when a merc is hired they get removed from the merc pool.
//TODO: Make it so that a merc can't be put into more than one event.
//TODO: Make it so that this works with game saves and we remember what's changed.

(function () {

    /** Returns an int value between 0 and the max (inclusive) given. 
    * @param max The upper boundary. */
    function getRandomInt(max) {
        max += 1;
        return Math.floor(Math.random() * Math.floor(max));
    }

    var mercPool = [];
    var deadMercs = [];
    var hiredMercs = [];
    var activeMercs = [];
    var backupMercPool = [];
    var currentMerc = {};

    function MercenarySystem () {
        throw new Error ("This is a static class");
    };

    MercenarySystem._currentMercs = [];

    MercenarySystem.GetMercenaryByID = function (eventID) {
        for (var i = 0; i < this._currentMercs.length; i++) {
            if (this._currentMercs[i].id == eventID) {
                return this._currentMercs[i].Merc;
            }
        }
    };

    /** Returns the sum of all mercenary weights combined.
     * @returns {number} The sum of all mercenary weights. */
    MercenarySystem.GetWeightSum = function ()
    {
        var sumOfWeights = 0;

        for (var i = 0; i < mercPool.length; i++) 
        {
            sumOfWeights += mercPool[i].Data.Weight;
        }

        return sumOfWeights;
    };

    MercenarySystem.GetMercenary = function ()
    {
        var sumOfWeights = this.GetWeightSum ();

        // Generate a random number between 0 and the weight number.
        var index = getRandomInt (sumOfWeights);

        for (var i = 0; i < mercPool.length; i++) 
        {
            // Decrement our random selection by the current mercenaries weight.
            index -= mercPool[i].Data.Weight;

            // If we are now less than zero, we select this mercenary.
            if (index <= 0)
            {
                return mercPool[i];
            }
        }

        return null;
    };

    // Remove merc from global pool and set them ready for hiring.
    MercenarySystem.ActivateMerc = function (merc)
    {
        for (var i = mercPool.length - 1; i >= 0; i--)
        {
            if (mercPool[i].Actor.id == merc.Actor.id)
            {
                console.log ("Activating.")
                activeMercs.push (merc);
                mercPool.splice (i, 1);
            }
        }

        console.log ("Active Mercs");
        console.log (activeMercs);
        console.log ("Merc Pool")
        console.log (mercPool);
    };

    // Remove merc from global pool and set them as hired.
    MercenarySystem.HireMerc = function (merc)
    {
        for (var i = activeMercs.length - 1; i >= 0; i--)
        {
            if (activeMercs[i].Actor.id == merc.Actor.id)
            {
                console.log ("Hiring.")
                hiredMercs.push (merc);
                activeMercs.splice (i, 1);
            }
        }

        console.log ("Hired Mercs");
        console.log (hiredMercs);
        console.log ("Active Pool")
        console.log (activeMercs);
    };

    // Rmove merc from all pools and set them as dead.
    MercenarySystem.KillMerc = function (merc)
    {
        for (var i = hiredMercs.length - 1; i >= 0; i--)
        {
            if (hiredMercs[i].Actor.id == merc.Actor.id)
            {
                console.log ("Killing.")
                deadMercs.push (merc);
                hiredMercs.splice (i, 1);
            }
        }

        console.log ("Dead Mercs");
        console.log (activeMercs);
        console.log ("Hired Pool")
        console.log (mercPool);
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () 
    {
        if (_DataManager_isDatabaseLoaded.call (this) === false) 
        {
            return false;
        }
        this.loadMercenaries ();

        return true;
    };

    DataManager.loadMercenaries = function ()
    {
        // Loop through all actors in the database.
        for (var i = 0; i < $dataActors.length; i++)
        {
            // Grab the current actor and make sure they exist.
            var actor = $dataActors[i];

            if (actor)
            {
                if (actor.note)
                {
                    // Parse the data from the actor and check if it's valid.
                    var mercenaryData = JSON.parse (actor.note);

                    if (mercenaryData)
                    {
                        // Store the actor and their data into the mercenary pool.
                        mercPool.push ({Actor: actor, Data: mercenaryData});
                    }
                }
            }
        }

        backupMercPool = mercPool;
    };

    var _Game_Interpreter_PluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) 
    {
        _Game_Interpreter_PluginCommand.call(this, command, args);

        if (command === "RotateMercs")
        {
            if (activeMercs.length > 0) {
                // Re add all of the active mercs back to the pool for re-selection.
                for (var i = activeMercs.length - 1; i >= 0; i--) {
                    mercPool.push(activeMercs[i]);
                }

                activeMercs.length = 0;
            }
            

            MercenarySystem._currentMercs.length = 0;
            for (var i = 0; i < $gameMap._events.length; i++)
            {
                var event = $gameMap._events[i];

                if (event)
                {
                    if (event.event ().note === "Mercenary")
                    {
                        var mercenary = MercenarySystem.GetMercenary ();
                        //NOTE: Cannot depend on data put on event to stay there.
                        //event.event ().Mercenary = mercenary;
                        MercenarySystem._currentMercs.push ({id: event.eventId (), Merc: mercenary});
                        // Remove chosen merc from pool and activate them.
                        MercenarySystem.ActivateMerc (mercenary);
                    }
                }
            }
        }

        if (command === "ShowMerc")
        {
            var eventID = Number (args[0]);
            var merc = $gameMap.event (eventID).event ().Mercenary;
            currentMerc = MercenarySystem.GetMercenaryByID (eventID);

            //console.log (currentMerc);

            // if (!currentMerc)
            //     console.log ("Uh Oh!");

            //Display mercenary window.
            SceneManager.push(CharacterSelection_Scene);
        }

        if (command === "HireMerc")
        {
            if (currentMerc)
            {
                var gameActor = $gameActors.actor (currentMerc.Actor.id);
                
                $gameParty.addActor(gameActor.actor().id);
                $gameParty.loseGold(currentMerc.Data.Price);
                MercenarySystem.HireMerc(currentMerc);
            }
        }
    };

    function CharacterSelection_HireWindow () {
        this.initialize.apply (this);
    };

    CharacterSelection_HireWindow.prototype = Object.create (Window_HorzCommand.prototype);
    CharacterSelection_HireWindow.prototype.constructor = CharacterSelection_HireWindow;

    CharacterSelection_HireWindow.prototype.initialize = function (x, y, width, height) {
        Window_HorzCommand.prototype.initialize.call (this, x, y, width, height);
        this.select (0);
        this.refresh ();
        this._data = [];
        this._data.push ("Don't Hire");
        this._data.push ("Hire");
        this._index = 0;
        // NOTE: This is necessary when using a command window to get it to register ok.
        this.addCommand ("Don't Hire", "Don't Hire");
        this.addCommand ("Hire", "Hire");
    };

    CharacterSelection_HireWindow.prototype.item = function () {
        return this._data[this._index];
    };

    CharacterSelection_HireWindow.prototype.windowWidth = function () {
        return 456;
    };

    CharacterSelection_HireWindow.prototype.refresh = function () {
        this.drawText ("Don't Hire", 0, 0, 300, "left");
        this.drawText ("Hire", 200, 0, 100, "left");
    };

    // CharacterSelection_HireWindow.prototype.processOK = function () {
    //     console.log ("Called");
    // };

    // NOTE: Both this and maxItems are necessary to make selection cursor move and work.
    CharacterSelection_HireWindow.prototype.maxCols = function () {
        return 2;
    };

    CharacterSelection_HireWindow.prototype.maxItems = function () {
        return this._data ? this._data.length : 0;
    };

    function CharacterSelection_CharacterWindow () {
        this.initialize.apply (this, arguments);
    };

    CharacterSelection_CharacterWindow.prototype = Object.create (Window_Base.prototype);
    CharacterSelection_CharacterWindow.prototype.constructor = CharacterSelection_CharacterWindow;

    CharacterSelection_CharacterWindow.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call (this, x, y, width, height);
        this.refresh ();
    };

    CharacterSelection_CharacterWindow.prototype.refresh = function () {
        //console.log ("called character window");
        this.contents.clear ();

        var skillPadding = 2;
        var currentRow = 0;
        var currentColumn = 0;
        var gameActor = $gameActors.actor (currentMerc.Actor.id);
        var skills = gameActor.skills ();
        
        // Status
        this.drawActorSimpleStatus (gameActor, 0, 0, 305);

        // Skills
        this.drawText ("Skills:", 335, 0, 300, 100, "left");
        for (var i = 0; i < skills.length; i++) {
            //TODO: Make it so it prints in a row/column and figure it out.
            this.drawText (skills[i].name + ": " + skills[i].mpCost, 335, 36 + (i * 36), 300, "left");
        }

        // Stats
        this.drawText ("Stats", 0, 100 + skillPadding, 300, "left");
        this.drawText ("ATK -> " + gameActor.atk, 0, 136 + skillPadding, 200, 200);
        this.drawText ("DEF -> " + gameActor.def, 0, 172 + skillPadding, 200, 200);
        this.drawText ("MAT -> " + gameActor.mat, 0, 208 + skillPadding, 200, 200);
        this.drawText ("MDF -> " + gameActor.mdf, 0, 244 + skillPadding, 200, 200);
        this.drawText ("AGI -> " + gameActor.agi, 0, 280 + skillPadding, 200, 200);
        this.drawText ("LCK -> " + gameActor.luk, 0, 316 + skillPadding, 200, 200);

        // Description
        this.drawText ("Description:", 0, 388, 300 + skillPadding, 100, "left");
        this.drawTextEx (gameActor.actor ().profile, 0, 424 + skillPadding, 1, 300, "left");
        this.resetFontSettings ();
    };

    function CharacterSelection_GoldWindow () {
        this.initialize.apply (this, arguments);
    };

    CharacterSelection_GoldWindow.prototype = Object.create (Window_Base.prototype);
    CharacterSelection_GoldWindow.prototype.constructor = CharacterSelection_GoldWindow;

    CharacterSelection_GoldWindow.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call (this, x, y, width, height);
        this.refresh ();
    };

    CharacterSelection_GoldWindow.prototype.refresh = function () {
        //console.log ("called gold window");
        this.contents.clear ();
        this.drawText ("Gold: " + $gameParty.gold (), 0, 0, 250, "left");
        this.drawText ("Cost: " + currentMerc.Data.Price, 0, 36, 250, "left");
    };

    function CharacterSelection_Scene() {
        this.initialize.apply(this, arguments);
    }

    CharacterSelection_Scene.prototype = Object.create(Scene_MenuBase.prototype);
    CharacterSelection_Scene.prototype.constructor = CharacterSelection_Scene;

    CharacterSelection_Scene.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    CharacterSelection_Scene.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);

        this.createGoldWindow();
        this.createCharacterWindow();
        this.createHireWindow();
        this._hireWindow.activate ();

        this._hireWindow.setHandler ("ok", this.onOk.bind (this));
        this._hireWindow.setHandler ("cancel", this.onCancel.bind(this));
    };

    CharacterSelection_Scene.prototype.createCharacterWindow = function () {
        //NOTE: This old method doesn't work. You have to pass in the correct window dimensions otherwise, when you set them afterwards, it will just clip them out of view. Try and experiment and see if removing the width/height from the constructor makes it work. For now, just make it so that you pass in the right values from the start.
        //NOTE: I think it's to do with the internal bitmap area. Dig into the window base to find out more.
        // this._characterWindow = new CharacterSelection_CharacterWindow(0,0, 100, 100);
        // this._characterWindow.width = 400;
        // this._characterWindow.height = this._goldWindow.y;

        this._characterWindow = new CharacterSelection_CharacterWindow (0, 0, Graphics.width, this._goldWindow.y);
        this.addWindow(this._characterWindow);
    };

    CharacterSelection_Scene.prototype.createGoldWindow = function () {
        this._goldWindow = new CharacterSelection_GoldWindow (0,0, 450, 100);
        this._goldWindow.y = Graphics.height - this._goldWindow.height;
        this.addWindow(this._goldWindow);
    };

    CharacterSelection_Scene.prototype.createHireWindow = function () {
        this._hireWindow = new CharacterSelection_HireWindow (0, 0, 0, 100);
        this._hireWindow.x = this._goldWindow.width;
        this._hireWindow.width = Graphics.width - this._hireWindow.x;
        this._hireWindow.y = Graphics.height - this._hireWindow.height;
        this.addWindow (this._hireWindow);
    };

    CharacterSelection_Scene.prototype.onOk = function () {
        var item = this._hireWindow.item ();
        var gameActor = $gameActors.actor (currentMerc.Actor.id);

        if (item === "Hire")
        {
            //console.log ($gameParty.gold ());
            //console.log (currentMerc.Data.Price);
            if ($gameParty.gold() > currentMerc.Data.Price)
            {
                if ($gameParty.members().length >= 4)
                {
                    this.onCancel ();
                    $gameVariables.setValue (1, 0);
                    $gameMessage.add ("Party already full. \nPlease dismiss a member first.");
                }
                else
                {
                    console.log (currentMerc);
                    console.log (hiredMercs);
                    this.onCancel ();
                    // Set the character variable so that the event system knows we've hired.
                    $gameVariables.setValue (1, 1);
                }
            }
            else
            {
                this.onCancel ();
                $gameVariables.setValue (1, 0);
                $gameMessage.add ("Not enough gold to hire.");
            }
        }

        if (item === "Don't Hire")
        {
            this.onCancel ();
            $gameVariables.setValue (1, 0);
        }
    };

    CharacterSelection_Scene.prototype.onCancel = function () {
        this._goldWindow.hide ();
        this._hireWindow.hide ();
        this._characterWindow.hide ();
        this.popScene();
    };

})();
