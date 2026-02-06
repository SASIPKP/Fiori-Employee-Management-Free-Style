/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["com/demo/employee/employeemanagement/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
