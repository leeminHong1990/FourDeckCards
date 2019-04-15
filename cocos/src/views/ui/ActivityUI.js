"use strict";
var ActivityUI = BasicDialogUI.extend({
    ctor:function() {
        this._super();
        this.resourceFilename = "res/ui/ActivityUI.json";
    },

    initUI:function(){
        var self = this;
        var activity_panel = this.rootUINode.getChildByName("activity_panel");
        activity_panel.getChildByName("close_btn").addTouchEventListener(function(sender, eventType){
            if(eventType == ccui.Widget.TOUCH_ENDED){
                self.hide();
            }
        });

        this.btn_list = [];
        this.panel_list = [];

        for(var i=0; i<5; i++){
            var btn = activity_panel.getChildByName("notice_btn" + i.toString());
            var panel = activity_panel.getChildByName("notice_panel" + i.toString());

            this.btn_list.push(btn);
            this.panel_list.push(panel);
        }

        UICommonWidget.create_tab(this.btn_list, this.panel_list)
    },
});