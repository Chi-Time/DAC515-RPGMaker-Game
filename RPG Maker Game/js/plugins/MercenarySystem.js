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

            //TODO: Display mercenary window.
        }
    };

    function Mercenary_MercWindow ()
    {
        this.initialize.apply (this, arguments);
    }

    Mercenary_MercWindow.prototype = Object.create (Window_Base.prototype);
    Mercenary_MercWindow.prototype.constructor = Mercenary_MercWindow;

    Mercenary_MercWindow.prototype.initialize = function (x, y, width, height)
    {
        Window_Base.prototype.initialize.call (this, x, y, width, height);
        this._item = null;
        this.refresh ();
    };

    Mercenary_MercWindow.prototype.setItem = function(item) 
    {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    Mercenary_MercWindow.prototype.refresh = function ()
    {
        //TODO: Format and display information here.
    };

})();
