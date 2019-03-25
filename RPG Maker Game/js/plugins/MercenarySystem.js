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
                        //NOTE: Cannot depend on data put on event to stay there.
                        //TODO: FInd another way to associate mercenary with event position.
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
            console.log ("event");
            console.log ($gameMap.event (eventID)); 
            console.log ($gameMap.event (eventID).event ());
            var merc = $gameMap.event (eventID).event ().Mercenary;
            currentMerc = merc;

            if (!currentMerc)
                console.log ("Uh Oh Spaghetii Niggas");

            //Display mercenary window.
            SceneManager.push(CharacterSelection_Scene);
        }
    };

    function CharacterSelection_HireWindow () {
        this.initialize.apply (this);
    };

    CharacterSelection_HireWindow.prototype = Object.create (Window_HorzCommand.prototype);
    CharacterSelection_HireWindow.prototype.constructor = CharacterSelection_HireWindow;

    CharacterSelection_HireWindow.prototype.initialize = function (x, y, width, height) {
        Window_HorzCommand.prototype.initialize.call (this, x, y, width, height);
    };

    CharacterSelection_HireWindow.prototype.windowWidth = function () {
        return 456;
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
        console.log ("called character window");
        this.contents.clear (); 
        this.drawText ($gameActors.actor (currentMerc.Actor.id).actor ().name, 0, 0, 300, "left");
        this.drawText ($gameActors.actor (currentMerc.Actor.id).currentClass().name, 300, 0, 300, "left");
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
        console.log ("called gold window");
        this.contents.clear ();
        this.drawText ("Gold: " + $gameParty.gold (), 0, 0, 250, "left");
        this.drawText ("Cost: " + 400, 0, 36, 250, "left");
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
    };

    CharacterSelection_Scene.prototype.onCancel = function () {
        this._goldWindow.hide ();
        this._hireWindow.hide ();
        this._characterWindow.hide ();
        this.popScene();
    };

})();
