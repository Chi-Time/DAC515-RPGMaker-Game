(function () {

    Window_ShopStatus.prototype.drawPossession = function(x, y) {
        var width = this.contents.width - this.textPadding() - x;
        var possessionWidth = this.textWidth('0000');
        this.changeTextColor(this.systemColor());
        this.drawText("You Have: ", x, y, width - possessionWidth);
        this.resetTextColor();
        this.drawText($gameParty.numItems(this._item), x, y, width, 'right');
    };

    Scene_Battle.prototype.createPartyCommandWindow = function() {
        this._partyCommandWindow = new Window_PartyCommand();
        this._partyCommandWindow.setHandler('fight',  this.commandFight.bind(this));
        this._partyCommandWindow.deselect();
        this.addWindow(this._partyCommandWindow);
    };

    Window_PartyCommand.prototype.makeCommandList = function() {
        this.addCommand(TextManager.fight,  'fight');
    };


})();