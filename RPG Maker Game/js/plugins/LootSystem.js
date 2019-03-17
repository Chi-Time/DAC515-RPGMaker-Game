/*:
 * @plugindesc Adds a loot system which uses color rarity and double weight tables.
 * @author James Johnson
 *
 * @help This plugin contains several plugin commands.
 * 
 * @param White Drop Weight
 * @desc The weighting of item drops. (Higher means more chance.)
 * @default 5
 * 
 * @param Green Drop Weight
 * @desc The weighting of item drops. (Higher means more chance.)
 * @default 4
 * 
 * @param Blue Drop Weight
 * @desc The weighting of item drops. (Higher means more chance.)
 * @default 3
 * 
 * @param Purple Drop Weight
 * @desc The weighting of item drops. (Higher means more chance.)
 * @default 2
 * 
 * @param Orange Drop Weight
 * @desc The weighting of item drops. (Higher means more chance.)
 * @default 1
 * 
 * @param Base Item Drop Weight
 * @desc The weighting of how likely item drops are to occur. (Higher means less chance.)
 * @default 3
 */

//TODO: Make it so that we check if there is more than one JSON tag in an object's note box.
//TODO: Make it so that loot system considers main characters equipped items too.
//TODO: Make chest test to get a statistical average.

/** Returns an int value between 0 and the max (inclusive) given. 
 * @param max The upper boundary. */
function getRandomInt(max) {
    max += 1;
    return Math.floor(Math.random() * Math.floor(max));
}

/** Returns an int value between the min (inclusive) and the max (inclusive) given. 
 * @param min The lower boundary.
 * @param max The upper boundary. */
function getRandomIntInRange (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

(function () {

    /** Enum for rarity colors */
    var EColors = {
        WHITE: 0,
        GREEN: 1,
        BLUE: 2, 
        PURPLE: 3,
        ORANGE: 4
    };

    //TODO: Find a way to refactor this to make it clearer.
    var battleDrop = {
        amount: 0,
        type: "Drop",
        should: false
    };

    /** Contains all color loot tables in game. (Use the EColors to select the table as it's indexed in the order of the enum. {ColorDrops[EColors.GREEN];}) */
    var ColorDrops = [];
    var WhiteDrops = [];
    var GreenDrops = [];
    var BlueDrops = [];
    var PurpleDrops = [];
    var OrangeDrops = [];

    var parameters = PluginManager.parameters ("LootSystem");
    var whiteWeight = Number(parameters["White Drop Weight"]);
    var greenWeight = Number(parameters["Green Drop Weight"]);
    var blueWeight = Number(parameters["Blue Drop Weight"]);
    var purpleWeight = Number(parameters["Purple Drop Weight"]);
    var orangeWeight = Number(parameters["Orange Drop Weight"]);
    var baseDropWeight = Number(parameters["Base Item Drop Weight"]);


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
            var shouldDrop = getRandomInt (baseDropWeight);

            if (shouldDrop == 0)
            {
                this.DropLoot (1);
                itemDropCount++;
            }
        }

        if (itemDropCount === 0)
        {
            $gameMessage.add ("Nothing special this time.");
        }
    };

    /** Drops loot from random tables with the given number of times.
     * @param amountToDrop The amount of times to drop loot. */
    LootSystem.DropLoot = function (amountToDrop)
    {
        for (var i = 0; i < amountToDrop; i++)
        {
            var table = LootSystem.GetColorTable ();
            var drop = LootSystem.GetDropFromTable (table);
            var code = LootSystem.GetColorCodeFromDrop (drop);

            // If we don't already have it, then add the item to the inventory.
            $gameMessage.newPage ();
            $gameMessage.add("\\C[0] You got:" + "\\C[" + code + "] " + drop.Item.name);
            $gameParty.gainItem(drop.Item, 99, false);
        }
    };

    /** Determines the items current rarity grade and returns a color code based on it.
     * @param drop The item to check the rarity of. */
    LootSystem.GetColorCodeFromDrop = function (drop)
    {
        switch (drop.Color)
        {
            case EColors.WHITE:
                return 0;
            case EColors.GREEN:
                return 3;
            case EColors.BLUE:
                return 1;
            case EColors.PURPLE:
                return 5;
            case EColors.ORANGE:
                return 2;
            default:
                return 0;
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
                        var color = rarityObj.Rarity.Color;

                        switch (rarityObj.Rarity.Color) 
                        {
                            case EColors.WHITE:
                                WhiteDrops.push ({Item: weapon, Weight: weight, Color: color});
                            break;
                            case EColors.GREEN:
                                GreenDrops.push ({Item: weapon, Weight: weight, Color: color});
                            break;
                            case EColors.BLUE:
                                BlueDrops.push ({Item: weapon, Weight: weight, Color: color});
                            break;
                            case EColors.PURPLE:
                                PurpleDrops.push ({Item: weapon, Weight: weight, Color: color});
                            break;
                            case EColors.ORANGE:
                                OrangeDrops.push ({Item: weapon, Weight: weight, Color: color});
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
                        var color = rarityObj.Rarity.Color;

                        switch (rarityObj.Rarity.Color) 
                        {
                            case EColors.WHITE:
                                WhiteDrops.push ({Item: armor, Weight: weight, Color: color});
                            break;
                            case EColors.GREEN:
                                GreenDrops.push ({Item: armor, Weight: weight, Color: color});
                            break;
                            case EColors.BLUE:
                                BlueDrops.push ({Item: armor, Weight: weight, Color: color});
                            break;
                            case EColors.PURPLE:
                                PurpleDrops.push ({Item: armor, Weight: weight, Color: color});
                            break;
                            case EColors.ORANGE:
                                OrangeDrops.push ({Item: armor, Weight: weight, Color: color});
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

    /** Preloads all rarity tables into a master table. */
    DataManager.loadColorTables = function () 
    {
        ColorDrops.push ({Drops: WhiteDrops, Weight: whiteWeight, Color: EColors.WHITE});
        ColorDrops.push ({Drops: GreenDrops, Weight: greenWeight, Color: EColors.GREEN});
        ColorDrops.push ({Drops: BlueDrops, Weight: blueWeight, Color: EColors.BLUE});
        ColorDrops.push ({Drops: PurpleDrops, Weight: purpleWeight, Color: EColors.PURPLE});
        ColorDrops.push ({Drops: OrangeDrops, Weight: orangeWeight, Color: EColors.ORANGE});

        // for (var i = 0; i < ColorDrops.length; i++)
        // {
        //     console.log (ColorDrops[i]);
        // }
    };

    /** Loads a table test which runs through a hundred drop simulations to test weighting of tables. */
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

        if (command === "BDrop")
        {
            battleDrop.amount = Number(args[0]);
            battleDrop.type = "Drop";
            battleDrop.should = true;
        }

        if (command === "BDropRandom")
        {
            battleDrop.amount = Number(args[0]);
            battleDrop.type = "Random";
            battleDrop.should = true;
        }
    };

    var _Game_System_OnBattleWin = Game_System.prototype.onBattleWin;
    Game_System.prototype.onBattleWin = function() {
        _Game_System_OnBattleWin.call (this);

        // IF we should drop something this battle
        if (battleDrop.should)
        {
            // Determine what form of drop will happen.
            if (battleDrop.type === "Drop")
            {
                LootSystem.DropLoot (battleDrop.amount);
            }
            else if (battleDrop.type === "Random")
            {
                Loot.DropLootRandom (battleDrop.amount);
            }
        }

        // Reset it for next time.
        battleDrop.should = false;
    };

})();