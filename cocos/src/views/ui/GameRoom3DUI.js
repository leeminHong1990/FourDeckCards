"use strict"

var GameRoom3DUI = GameRoomUI.extend({
	className:"GameRoom3DUI",
	uiType: const_val.GAME_ROOM_3D_UI,
	ctor:function(){
		this._super();
        this.resourceFilename = "res/ui/GameRoom3DUI.json";
	},

    show_cur_idx_frame:function () {
		cc.log("show_cur_idx_frame 3d");
    },
    update_win_player:function () {
		cc.log("update_win_player 3d");
    },
    update_wait_time_left:function () {
		cc.log("update_wait_time_left 3d");
    },
    update_not_discard_panel:function () {
		cc.log("update_not_discard_panel 3d");
    },
    update_player_discard_tiles:function () {
		cc.log("update_player_discard_tiles 3d");
    },
    playOperationEffect:function () {
		cc.log("playOperationEffect 3d");
    },
    update_no_big_panel:function () {
		cc.log("update_no_big_panel 3d");
    },
});