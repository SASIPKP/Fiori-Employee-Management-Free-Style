sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, History, MessageToast) {
    "use strict";

    return Controller.extend("com.demo.employee.employeemanagement.controller.CreateEmployee", {

        onInit: function () {
            this._resetModel();
            this.getOwnerComponent().getRouter().getRoute("EmployeeCreate")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function() {
            this._resetModel();
            var oEmployeesModel = this.getOwnerComponent().getModel("employees");
            if (oEmployeesModel) {
                oEmployeesModel.dataLoaded().then(function() {
                    this._buildDepartments(oEmployeesModel.getProperty("/Employees") || []);
                }.bind(this));
            }
        },

        _resetModel: function () {
            var oData = {
                EmpId: "",
                Name: "",
                Email: "",
                JobTitle: "",
                Department: "IT",
                Status: "Active",
                StartDate: new Date().toISOString().split('T')[0],
                Salary: "",
                Currency: "INR"
            };
            
            if (!this.getView().getModel("newEmployee")) {
                this.getView().setModel(new JSONModel(oData), "newEmployee");
            } else {
                this.getView().getModel("newEmployee").setData(oData);
            }
        },

        _buildDepartments: function (aEmployees) {
            var oMap = {};
            aEmployees.forEach(function (e) {
                if (e.Department) { oMap[e.Department] = true; }
            });
            var aDepartments = Object.keys(oMap).sort().map(d => ({ key: d, text: d }));
            
            if (aDepartments.length === 0) {
                aDepartments = [{ key: "IT", text: "IT" }, { key: "HR", text: "HR" }, { key: "Sales", text: "Sales" }];
            }
            this.getView().setModel(new JSONModel({ Departments: aDepartments }), "departments");
        },

        onSave: function () {
            var oEmployeesModel = this.getOwnerComponent().getModel("employees");
            var oNewEmployee = this.getView().getModel("newEmployee").getData();
            var aEmployees = oEmployeesModel.getProperty("/Employees") || [];

            // 1. Validate Mandatory Fields (excluding EmpId because we handle it below)
            if (!oNewEmployee.Name || !oNewEmployee.Email || !oNewEmployee.JobTitle || !oNewEmployee.StartDate) {
                MessageBox.error("Please fill in all mandatory fields marked with an asterisk (*).");
                return;
            }

            // 2. Email Validation
            var sEmailRegex = /^\w+[\w-.]*@\w+((-\w+)|(\w*))\.[a-z]{2,3}$/;
            if (!sEmailRegex.test(oNewEmployee.Email)) {
                MessageBox.error("Please enter a valid email address.");
                return;
            }

            // 3. Hybrid ID Logic
            if (!oNewEmployee.EmpId) {
                // If ID is empty, find the highest existing ID and add 1
                var iMaxId = aEmployees.reduce((max, emp) => {
                    var iCurrentId = parseInt(emp.EmpId);
                    return (!isNaN(iCurrentId) && iCurrentId > max) ? iCurrentId : max;
                }, 1000); // Default start if list is empty
                oNewEmployee.EmpId = String(iMaxId + 1);
            } else {
                // If user entered an ID, check for duplicates
                var bDuplicate = aEmployees.some(e => String(e.EmpId) === String(oNewEmployee.EmpId));
                if (bDuplicate) {
                    MessageBox.error("Employee ID " + oNewEmployee.EmpId + " already exists. Please enter a unique ID or leave it blank to auto-generate.");
                    return;
                }
            }

            // 4. Save to Model
            aEmployees.push(Object.assign({}, oNewEmployee));
            oEmployeesModel.setProperty("/Employees", aEmployees);
            
            MessageToast.show("Employee " + oNewEmployee.Name + " added with ID: " + oNewEmployee.EmpId);
            this.onNavBack();
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("EmployeeList", {}, true);
            }
        }
    });
});