sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/demo/employee/employeemanagement/model/models",
    "sap/ui/Device"
], function (UIComponent, models, Device) {
    "use strict";

    return UIComponent.extend("com.demo.employee.employeemanagement.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // create the views based on the url/hash
            this.getRouter().initialize();
        },

        getContentDensityClass: function() {
            if (!this._sContentDensityClass) {
                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});