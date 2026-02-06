sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, History, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.demo.employee.employeemanagement.controller.EmployeeDetail", {

        /* =========================================================== */
        /* Lifecycle Methods                                           */
        /* =========================================================== */

        onInit: function () {
            // Set local UI model to manage view states (like Edit mode)
            this.getView().setModel(new JSONModel({ isEditable: false }), "ui");

            // Attach a function that runs every time the URL pattern "EmployeeDetail" is matched
            this.getOwnerComponent().getRouter().getRoute("EmployeeDetail")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        /* =========================================================== */
        /* Routing & Binding                                           */
        /* =========================================================== */

        _onObjectMatched: function (oEvent) {
            // Get the employeeId from the URL parameters
            var sEmpId = String(oEvent.getParameter("arguments").employeeId);
            var oModel = this.getOwnerComponent().getModel("employees");
            
            // Always reset the view to display mode (not editable) when opening a new employee
            this.getView().getModel("ui").setProperty("/isEditable", false);

            // Wait for the data to load before searching for the employee
            oModel.dataLoaded().then(function() {
                var aEmployees = oModel.getProperty("/Employees") || [];
                
                // Find the array index of the employee with the matching ID
                var iIndex = aEmployees.findIndex(function (e) {
                    return String(e.EmpId) === sEmpId;
                });

                // If ID doesn't exist in our data, show error and go back
                if (iIndex === -1) {
                    MessageToast.show("Employee not found");
                    this.onNavBack();
                    return;
                }

                // Bind the specific employee record to the view using the index
                this.getView().bindElement({
                    path: "/Employees/" + iIndex,
                    model: "employees"
                });

                // Dynamically build the list of departments for the dropdown
                this._buildDepartmentsModel(aEmployees);
            }.bind(this));
        },

        /* =========================================================== */
        /* Edit / Save / Delete Actions                                */
        /* =========================================================== */

        onEditToggle: function () {
            var oUIModel = this.getView().getModel("ui");
            var bIsCurrentlyEditing = oUIModel.getProperty("/isEditable");
            var oModel = this.getOwnerComponent().getModel("employees");
            var oBindingContext = this.getView().getElementBinding("employees");
            
            if (!oBindingContext) return;
            var sPath = oBindingContext.getPath();

            if (!bIsCurrentlyEditing) {
                // START EDITING: Create a backup of the data in case user cancels
                this._oBackup = JSON.parse(JSON.stringify(oModel.getProperty(sPath)));
                oUIModel.setProperty("/isEditable", true);
            } else {
                // CANCEL EDITING: Restore data from the backup and close edit mode
                oModel.setProperty(sPath, this._oBackup);
                oUIModel.setProperty("/isEditable", false);
            }
        },

        onSave: function () {
            // Simply close the edit mode (In a real app, you would call an API here)
            this.getView().getModel("ui").setProperty("/isEditable", false);
            MessageToast.show("Employee record updated successfully");
        },

        onDelete: function () {
            var oModel = this.getOwnerComponent().getModel("employees");
            var oContext = this.getView().getBindingContext("employees");
            if (!oContext) return;

            var oEmployee = oContext.getObject();
            var sEmpId = String(oEmployee.EmpId);

            // Show a confirmation popup before deleting
            MessageBox.confirm("Are you sure you want to delete " + oEmployee.Name + "?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        var aEmployees = oModel.getProperty("/Employees") || [];
                        var iIndex = aEmployees.findIndex(e => String(e.EmpId) === sEmpId);

                        if (iIndex !== -1) {
                            // Remove the employee from the array
                            aEmployees.splice(iIndex, 1);
                            oModel.setProperty("/Employees", aEmployees);
                            MessageToast.show("Deleted successfully");
                            this.onNavBack(); // Return to list after deletion
                        }
                    }
                }.bind(this)
            });
        },

        /* =========================================================== */
        /* Helpers & Formatters                                        */
        /* =========================================================== */

        formatInitials: function (sName) {
            // Helper to get first letters of Name (e.g., "John Doe" -> "JD")
            if (!sName) return "";
            var aParts = sName.trim().split(/\s+/);
            var sInitials = aParts[0].charAt(0);
            if (aParts.length > 1) sInitials += aParts[aParts.length - 1].charAt(0);
            return sInitials.toUpperCase();
        },

        _buildDepartmentsModel: function (aEmployees) {
            // Helper to create a unique list of departments for the Select/ComboBox
            var oMap = {};
            aEmployees.forEach(function (e) {
                if (e.Department) oMap[e.Department] = true;
            });

            var aDepartments = Object.keys(oMap).sort().map(function (d) {
                return { key: d, text: d };
            });

            this.getView().setModel(new JSONModel({ Departments: aDepartments }), "departments");
        },

        onNavBack: function () {
            // Standard SAP UI5 logic to navigate to previous page
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                // If no history, go to the default list page
                this.getOwnerComponent().getRouter().navTo("EmployeeList", {}, true);
            }
        }
    });
});