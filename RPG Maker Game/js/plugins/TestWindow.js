
(function () {

    var _Scene_Map_Start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        _Scene_Map_Start.call (this);
        SceneManager.push (CharacterSelection_Scene);
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
        //this.drawText ("GD", 0, 0, 100, 100, "left");
        this.drawText ("Paul Sire", 25, 40, 300, "left");
        this.drawText ("Hey", 0, 100, 300, "left");
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