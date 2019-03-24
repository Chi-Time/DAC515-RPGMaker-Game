/*:
 * @plugindesc Adds a dungeon random selection system for curating dungeon choices.
 * @author James Johnson
 *
 * @help This plugin contains several plugin commands.
 */

//NOTE: Use this to access the actor you need.
//$gameActors.actor (mercPool[0].Actor.id))

(function () {

    /** Returns an int value between 0 and the max (inclusive) given. 
    * @param max The upper boundary. */
    function getRandomInt(max) {
        max += 1;
        return Math.floor(Math.random() * Math.floor(max));
    }

    var mercPool = [];
    var currentMerc = {};

    function MercenarySystem ()
    {
        throw new Error ("This is a static class");
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
    };

    var _Game_Interpreter_PlugingCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) 
    {
        _Game_Interpreter_PlugingCommand.call(this, command, args);

        if (command === "RotateMercs")
        {
            for (var i = 0; i < $gameMap._events.length; i++)
            {
                var event = $gameMap._events[i];

                if (event)
                {
                    if (event.event ().note === "Mercenary")
                    {
                        var mercenary = MercenarySystem.GetMercenary ();
                        event.event ().Mercenary = mercenary;
                    }
                }
            }
        }

        if (command === "ShowMerc")
        {
            var eventID = Number (args[0]);
            console.log ($gameMap.event (eventID));
            console.log ($gameMap.event (eventID).event ().Mercenary);
            currentMerc = $gameMap.event (eventID).event ().Mercenary;

            //Display mercenary window.
            SceneManager.push(MercSelection_Scene);
        }
    };

    function MercSelection_MercWindow ()
    {
        this.initialize.apply (this, arguments);
    }

    /** Creates and sets up a status screen for the requirments of each item to craft. */
    MercSelection_MercWindow.prototype = Object.create(Window_Base.prototype);
    MercSelection_MercWindow.prototype.constructor = MercSelection_MercWindow;

    //TODO: Try and have gold as help window see if that maybe fixes it.
    MercSelection_MercWindow.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call (this, x, y, width, height);
        this._item = currentMerc;
        this._pageIndex = 0;
        this.refresh ();
    };

    MercSelection_MercWindow.prototype.refresh = function () {
        console.log ("merc window called");
        //this.contents.clear ();
        //TODO: Format and display information here.
        this.drawText ($gameActors.actor (currentMerc.Actor.id).actor ().name, 0, 0, 300, "left");
        this.drawText ($gameActors.actor (currentMerc.Actor.id).currentClass().name, 300, 0, 300, "left");
    };

    MercSelection_MercWindow.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    function MercSelection_GoldWindow ()
    {
        this.initialize.apply (this, arguments);
    }

    MercSelection_GoldWindow.prototype = Object.create (Window_Base.prototype);
    MercSelection_GoldWindow.prototype.constructor = MercSelection_GoldWindow;

    MercSelection_GoldWindow.prototype.initialize = function (x, y, width, height)
    {
        console.log ("gold constructor")
        Window_Base.prototype.initialize.call (this, x, y, width, height);
        this._item = null;
        this.refresh ();
    };

    MercSelection_GoldWindow.prototype.setItem = function(item) 
    {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    MercSelection_GoldWindow.prototype.refresh = function ()
    {
        console.log ("Called");
        this.contents.clear ();
        this.drawText ("Gold: " + $gameParty.gold (), 0, 0, 250, "left");
        this.drawText ("Cost: " + 400, 0, 36, 250, "left");
    };

    function MercSelection_HireWindow ()
    {
        this.initialize.apply (this, arguments);
    }

    MercSelection_HireWindow.prototype= Object.create (Window_HorzCommand.prototype);
    MercSelection_HireWindow.prototype.constructor = MercSelection_HireWindow;

    MercSelection_MercWindow.prototype.initialize = function (x, y, width, height)
    {
        Window_Selectable.prototype.initialize.call (this, x, y, width, height);
    };

    MercSelection_HireWindow.prototype.windowWidth = function () {
        return 456;
    };

    function MercSelection_Scene ()
    {
        this.initialize.apply (this, arguments);
    }

    MercSelection_Scene.prototype = Object.create (Scene_MenuBase.prototype);
    MercSelection_Scene.prototype.constructor = MercSelection_Scene;

    MercSelection_Scene.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call (this);
    };

    MercSelection_Scene.prototype.create = function ()
    {
        Scene_MenuBase.prototype.create.call (this);
        this.createGoldWindow ();
        this.createHireWindow ();
        this.createMercWindow ();
        this._mercWindow.refresh ();
        this._hireWindow.activate ();

        this._hireWindow.setHandler ("ok", this.onOk.bind (this));
        this._hireWindow.setHandler ("cancel", this.onCancel.bind(this));
    };

    MercSelection_Scene.prototype.createGoldWindow = function ()
    {
        this._goldWindow = new MercSelection_GoldWindow (0, 0, 450, 100);
        this._goldWindow.y = Graphics.height - this._goldWindow.height;
        this.addWindow (this._goldWindow);
    };

    MercSelection_Scene.prototype.createHireWindow = function ()
    {
        this._hireWindow = new MercSelection_HireWindow (0, 0, 0, 100);
        this._hireWindow.x = this._goldWindow.width;
        this._hireWindow.width = Graphics.width - this._hireWindow.x;
        this._hireWindow.y = Graphics.height - this._hireWindow.height;
        this.addWindow (this._hireWindow);
    };

    MercSelection_Scene.prototype.createMercWindow = function ()
    {
        console.log ("drawing merc window");
        this._mercWindow = new MercSelection_MercWindow (0, 0, 0, 0);
        this._mercWindow.width = Graphics.width;
        this._mercWindow.height = this._goldWindow.y;
        this.addWindow (this._mercWindow);
    };

    MercSelection_Scene.prototype.onOk = function ()
    {
    };

    MercSelection_Scene.prototype.onCancel = function ()
    {
        this._goldWindow.hide ();
        this._hireWindow.hide ();
        this._mercWindow.hide ();
        this.popScene();
    };

})();
