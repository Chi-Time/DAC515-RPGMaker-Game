//TODO: Make it so that we check if there is more than one JSON tag in an object's note box.
//TODO: Make parameters so that base table weights can be changed in-engine.
//TODOL Make a parameter that determines what the base chance of an item even dropping is.
//TODO: Make it so that loot system considers main characters equipped items too.
//TODO: Ensure that when giving player items that they don't overflow 99. Make a conditional to fix it.

/** Returns an int value between 0 and the max (inclusive) given. */
function getRandomInt(max) {
    max += 1;
    return Math.floor(Math.random() * Math.floor(max));
}

(function () {
    // var Rarity = {
    //     Color: 0,
    //     Weight: 0
    // };

    /** Enum for rarity colors */
    var EColors = {
        WHITE: 0,
        GREEN: 1,
        BLUE: 2, 
        PURPLE: 3,
        ORANGE: 4
    };

    /** Contains all color loot tables in game. (Use the EColors to select the table as it's indexed in the order of the enum. {ColorDrops[EColors.GREEN];}) */
    var ColorDrops = [];
    var WhiteDrops = [];
    var GreenDrops = [];
    var BlueDrops = [];
    var PurpleDrops = [];
    var OrangeDrops = [];

    /** Static class for interacting with the loot system. */
    function LootSystem () 
    {
        throw new Error ("This is a static class");
    }

    /** Returns a random color table based on it's weighting. */
    LootSystem.GetColorTable = function ()
    {
        // Calculate the total sum of all the table weights by adding them together.
        var sumOfColorWeights = 0;

        for (var j = 0; j < ColorDrops.length; j++) 
        {
            sumOfColorWeights += ColorDrops[j].Weight;
        }

        // Generate a random number between 0 and the weight number.
        var index = getRandomInt (sumOfColorWeights);

        // Loop through the current master table's various loot tables.
        for (var j = 0; j < ColorDrops.length; j++) 
        {
            // Decrement our random selection by the current tables weight.
            index -= ColorDrops[j].Weight;

            // If we are now less than zero, we select this item.
            if (index <= 0)
            {
                return ColorDrops[j];
            }
        }
    };

    /** Returns a random item from the given color table based on it's weighting.
     * @param table The color table to get loot from. */
    LootSystem.GetDropFromTable = function (table)
    {
        // Calculate the total sum of all the item weights by adding them together.
        var sumOfWeights = 0;

        for (var i = 0; i < table.Drops.length; i++)
        {
            sumOfWeights += table.Drops[i].Weight;
        }

        // Generate a random number between 0 and the weight number.
        var index = getRandomInt (sumOfWeights);

        // Loop through the current loot table's held items (drops)
        for (var j = 0; j < table.Drops.length; j++)
        {
            // Decrement our random selection by the current item's weight.
            index -= table.Drops[j].Weight;
            
            // If we are now less than zero, we select this item.
            if (index <= 0)
            {
                return table.Drops[j];
            }
        }

        return null;
    };

    /** Drops loot from random tables with the given number of times with a chance on every drop to get nothing at all.
     * @param amounToDrop The amount of times to drop loot. */
    LootSystem.DropLootRandom = function (amountToDrop)
    {
        var itemDropCount = 0;

        for (var i = 0; i < amountToDrop; i++)
        {
            // 1/3 chance that an item even drops.
            var shouldDrop = getRandomInt (3);

            if (shouldDrop == 0)
            {
                this.DropLoot (1);
                itemDropCount++;
            }
        }

        if (itemDropCount === 0)
        {
            $gameMessage.add ("Looks like there was nothing.");
        }
    };

    /** Drops loot from random tables with the given number of times.
     * @param amounToDrop The amount of times to drop loot. */
    LootSystem.DropLoot = function (amountToDrop)
    {
        for (var i = 0; i < amountToDrop; i++)
        {
            var table = LootSystem.GetColorTable ();
            var drop = LootSystem.GetDropFromTable (table);
            
            $gameMessage.add ("You got: " + drop.Item.name);
            $gameParty.gainItem (drop.Item, 1, false);
        }
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () 
    {
        if (_DataManager_isDatabaseLoaded.call (this) === false) 
        {
            return false;
        }

        this.loadWeaponLoot ();
        this.loadArmorLoot ();
        this.loadColorTables ();
        //this.loadTableTest ();

        return true;
    };

    /** Preloads all weapons into the game's loot tables. */
    DataManager.loadWeaponLoot = function ()
    {
        for (var i = 0; i < $dataWeapons.length; i++)
        {
            if ($dataWeapons[i]) 
            {
                var weapon = $dataWeapons[i];

                if (weapon.note) 
                {
                    var rarityObj = JSON.parse(weapon.note);

                    if (rarityObj) 
                    {
                        var weight = rarityObj.Rarity.Weight;

                        switch (rarityObj.Rarity.Color) 
                        {
                            case EColors.WHITE:
                                WhiteDrops.push ({Item: weapon, Weight: weight});
                            break;
                            case EColors.GREEN:
                                GreenDrops.push ({Item: weapon, Weight: weight});
                            break;
                            case EColors.BLUE:
                                BlueDrops.push ({Item: weapon, Weight: weight});
                            break;
                            case EColors.PURPLE:
                                PurpleDrops.push ({Item: weapon, Weight: weight});
                            break;
                            case EColors.ORANGE:
                                OrangeDrops.push ({Item: weapon, Weight: weight});
                            break;
                            default:
                                console.log ("Nothing to see here");
                            break;
                        }
                    }
                }
            }
        }
    };

    /** Preloads all armors into the game's loot tables. */
    DataManager.loadArmorLoot = function ()
    {
        for (var i = 0; i < $dataArmors.length; i++)
        {
            if ($dataArmors[i]) 
            {
                var armor = $dataArmors[i];

                if (armor.note) 
                {
                    var rarityObj = JSON.parse(armor.note);

                    if (rarityObj) 
                    {
                        var weight = rarityObj.Rarity.Weight;

                        switch (rarityObj.Rarity.Color) 
                        {
                            case EColors.WHITE:
                                WhiteDrops.push ({Item: armor, Weight: weight});
                            break;
                            case EColors.GREEN:
                                GreenDrops.push ({Item: armor, Weight: weight});
                            break;
                            case EColors.BLUE:
                                BlueDrops.push ({Item: armor, Weight: weight});
                            break;
                            case EColors.PURPLE:
                                PurpleDrops.push ({Item: armor, Weight: weight});
                            break;
                            case EColors.ORANGE:
                                OrangeDrops.push ({Item: armor, Weight: weight});
                            break;
                            default:
                                console.log ("Nothing to see here");
                            break;
                        }
                    }
                }
            }
        }
    };

    DataManager.loadColorTables = function () 
    {
        ColorDrops.push ({Drops: WhiteDrops, Weight: 5, Color: 0});
        ColorDrops.push ({Drops: GreenDrops, Weight: 4, Color: 1});
        ColorDrops.push ({Drops: BlueDrops, Weight: 3, Color: 2});
        ColorDrops.push ({Drops: PurpleDrops, Weight: 2, Color: 3});
        ColorDrops.push ({Drops: OrangeDrops, Weight: 1, Color: 4});

        // for (var i = 0; i < ColorDrops.length; i++)
        // {
        //     console.log (ColorDrops[i]);
        // }
    };

    DataManager.loadTableTest = function ()
    {
        var whiteCount = 0;
        var greenCount = 0;
        var blueCount = 0;
        var purpleCount = 0;
        var orangeCount = 0;

        for (var i = 0; i < 100; i++)
        {
            var table = LootSystem.GetColorTable ();
            var item = LootSystem.GetDropFromTable (table);

            console.log (item);

            console.log (item.Item.name + " " + table.Color);

            switch (table.Color) 
            {
                case EColors.WHITE:
                    whiteCount++;
                    break;
                case EColors.GREEN:
                    greenCount++;
                    break;
                case EColors.BLUE:
                    blueCount++;
                    break;
                case EColors.PURPLE:
                    purpleCount++;
                    break;
                case EColors.ORANGE:
                    orangeCount++;
                    break;
                default:
                    console.log("nothing");
                    break;
            }
        }

        console.log ("White Items Chosen: " + whiteCount);
        console.log ("Green Items Chosen: " + greenCount);
        console.log ("Blue Items Chosen: " + blueCount);
        console.log ("Purple Items Chosen: " + purpleCount);
        console.log ("Orange Items Chosen: " + orangeCount);
    };

    var _Game_Interpreter_PlugingCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) 
    {
        _Game_Interpreter_PlugingCommand.call(this, command, args);

        if (command === "Drop") 
        {
            LootSystem.DropLoot (Number (args[0]));
        }

        if (command === "DropRandom") 
        {
            LootSystem.DropLootRandom (Number (args[0]));
        }
    };

})();