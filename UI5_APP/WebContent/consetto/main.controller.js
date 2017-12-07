sap.ui.controller("consetto.main", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf consetto.main
*/
	onInit: function() {
		var msg_strip = this.getView().byId("msg_strip");
		
		// Hide the MessageStrip initially
		msg_strip.setVisible(false);
	},

	onUpload: function(oEvent) {
		var oFileUploader = this.getView().byId("FileUploader");
		var msg_strip     = this.getView().byId("msg_strip");
		var ps_name       = this.getView().byId("PlanningSequence");
		var formats       = ['xls', 'xlsx', 'txt'];
			
		// Check if the user entered required data
		if(!ps_name.getValue()) {
			sap.m.MessageToast.show("Please enter the sequence name");
			return;
		}
		if(!oFileUploader.getValue()) {
			sap.m.MessageToast.show("Please select a file first");
			return;
		}
		
		var sFileName = oFileUploader.getValue();
		var ps_name = ps_name.getValue();
		var domRef = oFileUploader.getFocusDomRef();
		var file = domRef.files[0];
		var base64_marker = 'data:' + file.type + ';base64,';
		var file_format = sFileName.split('.').pop();
		
		// Check the file format
		if (formats.indexOf(file_format) > -1 ) {
			sap.m.MessageToast.show("The file format is not supported");
			return;
		}
			
		// Create a File Reader object
		var file_reader = new FileReader();
		file_reader.onload = (function(e) {
			return function(evt) {
				// Find base64 data
				var base_index = evt.target.result.indexOf(base64_marker) + base64_marker.length;
				// Get base64 data
				var base64_data = evt.target.result.substring(base_index);
				
				var sUploadService = window.location.origin + "/sap/opu/odata/SAP/ZFILEUPLOAD_SRV/UPLOAD_MAPSet";
				$.ajaxSetup({ cache: false });
				// Fetch CSRF Token
				jQuery.ajax({
					url : sUploadService,
					type : "GET",
				    async: false,
				    beforeSend : function(xhr) {
				    	xhr.setRequestHeader("X-CSRF-Token", "Fetch");
				    },
				    success : function(data, textStatus, XMLHttpRequest) {
				    	// Read the CSRF token value from header
				    	token = XMLHttpRequest.getResponseHeader('X-CSRF-Token');
				    },
					error : function(data, textStatus, XMLHttpRequest) {
					}
				});
				
				$.ajaxSetup({ cache: false });
				
				// Upload the file data to OData service
				jQuery.ajax({
					url : sUploadService,
					async : false,
					dataType : 'json',
					cache : false,
					data : base64_data,
					type : "POST",
					beforeSend : function(xhr) {
						xhr.setRequestHeader("X-CSRF-Token", token);
						xhr.setRequestHeader("Content-Type", file.type);
						xhr.setRequestHeader("slug", sFileName);
						xhr.setRequestHeader("ps-name", ps_name);
					},
					success : function(data, textStatus, XMLHttpRequest) {
						// Get message from response header
						var message = XMLHttpRequest.getResponseHeader("custom-message");
				          
				        // Set the message in the MessageStrip
						msg_strip.setText(message);
						msg_strip.setVisible(true);
					},
					error : function(data, textStatus, XMLHttpRequest) {
						// Set the error in the MessageStrip
						msg_strip.setText("Planning sequence "+ ps_name +" could not be executed.");
						msg_strip.setVisible(true);
					}
				});
			};
		})(file);
		file_reader.readAsDataURL(file);
		return;
	}
	
	
/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf consetto.main
*/
//	onExit: function() {
//
//	}

});