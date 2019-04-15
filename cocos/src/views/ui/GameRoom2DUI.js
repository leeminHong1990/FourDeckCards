"use strict"

var GameRoom2DUI = GameRoomUI.extend({
    className: "GameRoom2DUI",
    uiType: const_val.GAME_ROOM_2D_UI,
    ctor: function () {
        this._super();
        this.resourceFilename = "res/ui/GameRoom2DUI.json";
    },

    // update_player_hand_tiles:function () {
    //     cc.log("update_player_hand_tiles 2d")
    // },
    //
    // init_operation_panel:function () {
    //     cc.log("init_operation_panel 2d")
    // },
    //
    // update_operation_panel:function () {
    //     cc.log("update_operation_panel 2d")
    // },
    // update_curscore_panel:function () {
    //     cc.log("update_curscore_panel 2d")
    // },
    // update_curscore_curprize_panel:function () {
    //     cc.log("update_curscore_curprize_panel 2d")
    // },
});