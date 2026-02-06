sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, Filter, FilterOperator, Sorter, JSONModel, Fragment) {
    "use strict";

    return Controller.extend("com.demo.employee.employeemanagement.controller.EmployeeList", {

        onInit: function () {
            var oViewModel = new JSONModel({
                tableTitle: "Employees",
                sortDescending: false
            });
            this.getView().setModel(oViewModel, "worklistView");

            this._oTableFilters = {
                search: [],
                dialog: []
            };
        },

        onCreateEmployee: function () {
            this.getOwnerComponent().getRouter().navTo("EmployeeCreate");
        },

        onTableUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            var sTitle = iTotal ? "Employees (" + iTotal + ")" : "Employees";
            this.getView().getModel("worklistView").setProperty("/tableTitle", sTitle);
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            this._oTableFilters.search = [];

            if (sQuery && sQuery.length > 0) {
                this._oTableFilters.search.push(new Filter({
                    filters: [
                        new Filter("Name", FilterOperator.Contains, sQuery),
                        new Filter("EmpId", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            this._applyCombinedFilters();
        },

        onConfirmFilter: function (oEvent) {
            var mParams = oEvent.getParameters();
            this._oTableFilters.dialog = [];

            mParams.filterItems.forEach(function (oItem) {
                var sPath = oItem.getParent().getKey(); 
                var sKey = oItem.getKey();              
                var oFilter = new Filter(sPath, FilterOperator.EQ, sKey);
                this._oTableFilters.dialog.push(oFilter);
            }.bind(this));

            this._applyCombinedFilters();
        },

        /**
         * Standard SAP Fiori reset logic
         */
        onClearFilters: function () {
            // 1. Reset Internal State
            this._oTableFilters.dialog = [];
            
            // 2. Clear UI Dialog Selections
            if (this._pFilterDialog) {
                this._pFilterDialog.then(function(oDialog) {
                    oDialog.clearFilters();
                });
            }

            this._applyCombinedFilters();
        },

        /**
         * Updated to handle InfoToolbar visibility and Filter Button state
         */
        _applyCombinedFilters: function () {
            var aFinalFilters = [];
            var oTable = this.byId("idEmployeeTable");
            var oBinding = oTable.getBinding("items");
            var oInfoToolbar = this.byId("idFilterInfoToolbar");
            var oInfoText = this.byId("idFilterInfoText");
            var oFilterButton = this.byId("filterButton");

            // Combine Search
            if (this._oTableFilters.search.length > 0) {
                aFinalFilters.push(this._oTableFilters.search[0]);
            }

            // Combine Dialog Filters
            if (this._oTableFilters.dialog.length > 0) {
                aFinalFilters.push(new Filter({
                    filters: this._oTableFilters.dialog,
                    and: false 
                }));
            }

            // Apply to Binding
            if (oBinding) {
                var oCombinedFilter = new Filter({ filters: aFinalFilters, and: true });
                oBinding.filter(aFinalFilters.length > 0 ? oCombinedFilter : []);
            }

            // --- UI FEEDBACK LOGIC ---
            
            var bHasDialogFilters = this._oTableFilters.dialog.length > 0;

            // 1. Toggle InfoToolbar
            if (oInfoToolbar) {
                oInfoToolbar.setVisible(bHasDialogFilters);
                
                // Set descriptive text: e.g., "Filtered by: Status, Department"
                var aPaths = this._oTableFilters.dialog.map(f => f.getPath());
                var aUniquePaths = [...new Set(aPaths)];
                oInfoText.setText("Filtered by: " + aUniquePaths.join(", "));
            }

            // 2. Update Filter Button Type (Emphasized if active)
            if (oFilterButton) {
                oFilterButton.setType(bHasDialogFilters ? "Emphasized" : "Transparent");
            }
        },

        onItemPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("employees");
            if (oCtx) {
                this.getOwnerComponent().getRouter().navTo("EmployeeDetail", {
                    employeeId: oCtx.getProperty("EmpId")
                });
            }
        },

        onOpenFilterDialog: function () {
            var oView = this.getView();
            if (!this._pFilterDialog) {
                this._pFilterDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.demo.employee.employeemanagement.view.FilterDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pFilterDialog.then(function (oDialog) {
                oDialog.open();
            });
        }
    });
});