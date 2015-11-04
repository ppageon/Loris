LoadInstrument = React.createClass({displayName: "LoadInstrument",
	render: function () {
		var spanDownStyle = {
			display: 'none'
		};
		return (
			React.createElement("div", {className: "col-sm-4 hidden-xs"}, 
			    React.createElement("div", {className: "panel panel-primary"}, 
			        React.createElement("div", {className: "panel-heading", onclick: "hideLoad();"}, 
			            "Load Instrument (optional)", 
			            React.createElement("span", {className: "glyphicon glyphicon-chevron-down pull-right", style: spanDownStyle, id: "down-load"}), 
			            React.createElement("span", {className: "glyphicon glyphicon-chevron-up pull-right", id: "up-load"})
			        ), 
			        React.createElement("div", {className: "panel-body", id: "panel-load"}, 
			            React.createElement("input", {className: "fileUpload", type: "file", id: "instfile"}), 
			            React.createElement("br", null), 
			            React.createElement("input", {className: "btn btn-default", type: "button", id: "load", value: "Load Instrument"})
			        )
			    )
			)
		);
	}
});

DisplayElements = React.createClass({displayName: "DisplayElements",
	getInitialState: function() {
	    return {elements: this.props.elements};
	  },
	getPlaceholder: function() {
	    if (!this.placeholder) {
	      var tr = document.createElement('tr');
	      tr.className = "placeholder";
	      var td = document.createElement('td');
	      td.colSpan = 2;
	      td.appendChild(document.createTextNode("Drop here"));
	      tr.appendChild(td);
	      this.placeholder = tr;
	    }
	    return this.placeholder;
	},
	getTableRow: function(element) {
	    if (element.tagName !== 'tr') {
	      return $(element).closest('tr')[0];
	    }
	    else {
	      return element;
	    }
	},
	dragStart: function(e) {
	    this.dragged = this.getTableRow(e.currentTarget);
	    e.dataTransfer.effectAllowed = 'move';
	    // Firefox requires dataTransfer data to be set
	    e.dataTransfer.setData("text/html", e.currentTarget);
	},
	dragEnd: function(e) {
	    this.dragged.style.display = "table-row";
	    this.dragged.parentNode.removeChild(this.getPlaceholder());

	    // Update data
	    var data = this.state.elements;
	    var from = Number(this.dragged.dataset.id);
	    var to = Number(this.over.dataset.id);
	    if (from < to) to--;
	    if (this.nodePlacement == "after") to++;
	    data.splice(to, 0, data.splice(from, 1)[0]);
	    this.setState({data: data});
	},
	dragOver: function(e) {
	    e.preventDefault();
	    var targetRow = this.getTableRow(e.target);

	    this.dragged.style.display = "none";
	    if (targetRow.className == "placeholder") return;
	    this.over = targetRow;
	    // Inside the dragOver method
	    var relY = e.pageY - $(this.over).offset().top;
	    var height = this.over.offsetHeight / 2;
	    var parent = targetRow.parentNode;

	    if (relY >= height) {
	      this.nodePlacement = "after";
	      parent.insertBefore(this.getPlaceholder(), targetRow.nextElementSibling);
	    }
	    else { // relY < height
	      this.nodePlacement = "before"
	      parent.insertBefore(this.getPlaceholder(), targetRow);
	    }
	},
	editElement: function (element) {
		alert("ksfnks");
	},
	render: function () {
		var temp = this.state.elements.map((function(element, i){
						return (
							React.createElement("tr", {"data-id": i, 
					            key: i, 
					            draggable: "true", 
					            onDragEnd: this.dragEnd, 
					            onDragStart: this.dragStart}, 
									React.createElement("td", {className: "col-xs-2"}, 
										element.databaseName
									), 
									React.createElement("td", {className: "col-xs-8"}, 
										element.elementType
									), 
									React.createElement("td", {className: "col-xs-2"}, 
										React.createElement("button", {onClick: this.editElement.bind(this, element), className: "button"}, 
											"Edit"
										)
									)
							)
						)
					}).bind(this));
		return (
			React.createElement("table", {id: "sortable", className: "table table-hover"}, 
				React.createElement("tbody", {onDragOver: this.dragOver}, 
					temp
				)
			)
		)
	}
});

AddElement = React.createClass({displayName: "AddElement",
	getInitialState: function() {
	 	return {
	 		options: []
	 	};
	},
	selectType: function (id) {
		$(".options").hide();
        $(".option").removeClass("selected");
        $("#" + id).addClass("selected");
        // id = $(this).attr("id");
        $("#" + id + "options").toggle();
        $('#search_concept').text($("#" + id).text());
	},
	addQuestion: function () {
		selected = $(".selected").attr("id");
	    if(!selected) {
	        alert("No element type selected");
	        return;
	    }

	    questionText = document.getElementById("questionText");
	    questionName = document.getElementById("questionName");
	    if(questionText.value == '' && selected != 'line') {
	        if(selected == 'page-break') {
	            alert("Must use question text as page header");
	        } else {
	            alert("No question text specified");
	        }
	        return;
	    }
	    if(questionName.value == '' && selected != "header" && selected != "label" && selected != 'line' && selected != 'page-break') {
	        alert("Must specifiy name for database to save value into");
	        return;
	    }
	    var elementType;
	    switch(selected){
	    	case 'header':
	    		elementType = React.createElement(HeaderElement, {header: questionText.value})
	    		break;
	    	case 'label':
	    		elementType = React.createElement(LabelElement, {label: questionText.value})
	    		break;
	    	case 'scored':
	    		elementType = React.createElement(ScoredElement, {label: questionText.value})
	    		break;
	    	case 'textbox':
	    		elementType = React.createElement(TextboxElement, {label: questionText.value})
	    		break;
	    	case 'textarea':
	    		elementType = React.createElement(TextareaElement, {label: questionText.value})
	    		break;
	    	case 'dropdown':
	    		elementType = React.createElement(SelectElement, {label: questionText.value, options: this.state.options})
	    		break;
	    	case 'multiselect':
	    		elementType = React.createElement(SelectElement, {
	    							label: questionText.value, 
	    							options: this.state.options, 
	    							multiple: "true"}
	    					   )
	    		break;
	    	case 'date':
	    		min = parseInt(document.getElementById('datemin').value, 10);
		        max = parseInt(document.getElementById('datemax').value, 10);
	    		elementType = React.createElement(DateElement, {
	    							label: questionText.value, 
	    							minYear: min, 
	    							maxYear: max}
	    					   )
	    		break;
	    	case 'numeric':
	    		min = parseInt(document.getElementById('numericmin').value, 10);
		        max = parseInt(document.getElementById('numericmax').value, 10);
	    		elementType = React.createElement(NumericElement, {
	    							label: questionText.value, 
	    							min: min, 
	    							max: max}
	    					   )
	    		break;
	    	case 'defualt':
	    		break;
	    }

	    this.props.updateQuestions(questionName.value, elementType);

	    question = document.createElement("span");
	    question.innerHTML = questionText.value;
	    question.setAttribute("contenteditable", "true");

	    switch(selected){
	    	case 'textbox':
	    	case 'textarea':
	    		addTextQuestion(question);
	    		break;
	    	case 'dropdown':
	    		q  = addDropdownQuestion(question);
	    		break;
	    	case 'multiselect':
	    		q  = addDropdownQuestion(question, 'multi');
	    		break;
	    	case 'date':
	    		min = parseInt(document.getElementById('datemin').value, 10);
		        max = parseInt(document.getElementById('datemax').value, 10);
		        q = addDateQuestion(question, min, max);
		        break;
	    	case 'numeric':
	    		min = parseInt(document.getElementById('numericmin').value, 10);
		        max = document.getElementById('numericmax').value;
		        q = addNumericQuestion(question, min, max);
		        break;
	    	case 'scored':
	    	case 'header':
	    	case 'label':
	    	case 'page-break':
	    		q = addStaticQuestion(selected, question);
	    		break;
	    	case 'defualt':
	    		q = [];
	    }

	    display = document.createElement("td");
	    for(e in q) {
	        if(q[e]) {
	            display.appendChild(q[e]);
	        }
	    }
	    row = document.createElement("tr");
	    $(row).addClass("_moveable");
	    dbname = document.createElement("td");
	    if(selected != "header" && selected != "label" && selected != "line" && selected != "page-break") {
	        dbname.innerHTML = questionName.value;
	        dbname.setAttribute("contenteditable", "true");
	        $(dbname).bind("change", function() { Rules.rebuildMenu("rule_q", "workspace"); Rules.rebuildMenu("rule_depends", "workspace", { dropdownOnly: true }); });
	    }
	    dbtype = document.createElement("td");
	    dbtype.innerHTML = selected;

	    actions = document.createElement("td");
	    actions.innerHTML = '(<a onclick="return moveUp(this);" href="javascript:return 0;">up</a>) (<a onclick="return moveDown(this);" href="javascript:return 0;">down</a>) (<a onclick="removeRow(this);" href="javascript:return 0;">delete</a>)';

	    row.appendChild(dbname);
	    row.appendChild(dbtype);
	    row.appendChild(display);
	    row.appendChild(actions);
	    document.getElementById("workspace").appendChild(row);

	    // Add the question to the rules dropdowns too
	    if(questionName.value) {
	        select = document.createElement("option");
	        select.setAttribute("value", questionName.value);
	        select.innerHTML = questionName.value;
	        document.getElementById("rule_q").appendChild(select);
	        document.getElementById("rule_depends").appendChild(select.cloneNode(true));
	    }
	    Rules.rebuildMenu("rule_q", "workspace");
	    Rules.rebuildMenu("rule_depends", "workspace", { dropdownOnly: true });
	},
	addOption: function (multi) {
		this.setState(function(state){
			var temp = state.options,
				option = multi ? $("#newmultiSelectOption").val() : $("#newSelectOption").val();
			temp.push(option);
			return {
				options: temp
			};
		});
	},
	resetOptions: function(){
		this.setState(function(state){
			return {
				options: []
			};
		});
	},
	render: function () {
		return (
			React.createElement("div", {className: "col-xs-12"}, 
				React.createElement("h2", null, "Add Question"), 
			    React.createElement("form", {className: "form-horizontal", role: "form"}, 
			        React.createElement("div", {className: "form-group"}, 
			            React.createElement("label", {for: "selected-input", className: "col-sm-2 control-label"}, "Question Type:"), 
			            React.createElement("div", {className: "col-sm-4"}, 
			                React.createElement("div", {className: "btn-group"}, 
			                    React.createElement("button", {id: "selected-input", type: "button", className: "btn btn-default dropdown-toggle", "data-toggle": "dropdown"}, 
			                        React.createElement("span", {id: "search_concept"}, "Select One "), 
			                        React.createElement("span", {className: "caret"})
			                    ), 
			                    React.createElement("ul", {className: "dropdown-menu", role: "menu"}, 
			                        React.createElement("li", null, 
			                            React.createElement("div", {className: "col-sm-12"}, React.createElement("h5", {className: ""}, "Information"))
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "header")}, 
			                            React.createElement("a", {id: "header", className: "option", title: "Centered, header information"}, "Header")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "label")}, 
			                            React.createElement("a", {id: "label", className: "option", title: "Unemphasized display text"}, "Label")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "scored")}, 
			                            React.createElement("a", {id: "scored", className: "option", title: "Column which stores calculated data"}, "Scored Field")
			                        ), 
			                        React.createElement("li", {className: "divider"}), 
			                        React.createElement("li", null, 
			                            React.createElement("div", {className: "col-sm-12"}, React.createElement("h5", {className: ""}, "Data entry"))
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "textbox")}, 
			                            React.createElement("a", {id: "textbox", className: "option", title: "Text box for user data entry"}, "Textbox")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "textarea")}, 
			                            React.createElement("a", {id: "textarea", className: "option", title: "Larger text area for data entry"}, "Textarea")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "dropdown")}, 
			                            React.createElement("a", {id: "dropdown", className: "option", title: "Dropdown menu for users to select data from"}, "Dropdown")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "multiselect")}, 
			                            React.createElement("a", {id: "multiselect", className: "option", title: "Data entry where multiple options may be selected"}, "Multiselect")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "date")}, 
			                            React.createElement("a", {id: "date", className: "option", title: "User data entry of a date"}, "Date")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "numeric")}, 
			                            React.createElement("a", {id: "numeric", className: "option", title: "User data entry of a number"}, "Numeric")
			                        ), 
			                        React.createElement("li", {className: "divider"}), 
			                        React.createElement("li", null, 
			                            React.createElement("div", {className: "col-sm-12"}, React.createElement("h5", {className: ""}, "Formatting"))
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "line")}, 
			                            React.createElement("a", {id: "line", className: "option", title: "Empty line"}, "Blank Line")
			                        ), 
			                        React.createElement("li", {onClick: this.selectType.bind(this, "page-break")}, 
			                            React.createElement("a", {id: "page-break", className: "option", title: "Start a new page"}, "Page Break")
			                        )
			                    )
			                )
			            )
			        ), 
			            React.createElement("div", {className: "form-group"}, 
			                React.createElement("label", {className: "col-sm-2 control-label"}, "Question Name: "), 
			                React.createElement("div", {className: "col-sm-6"}, 
			                    React.createElement("input", {className: "form-control", type: "text", id: "questionName"})
			                )
			            ), 
			            React.createElement("div", {className: "form-group"}, 
			                React.createElement("label", {className: "col-sm-2 control-label"}, "Question Text: "), 
			                React.createElement("div", {className: "col-sm-6"}, 
			                    React.createElement("input", {className: "form-control", type: "text", id: "questionText", size: "75"})
			                )
			            ), 

			            React.createElement("div", {id: "dropdownoptions", className: "options"}, 
			                React.createElement("div", {className: "form-group"}, 
			                    React.createElement("label", {className: "col-sm-2 control-label"}, "Dropdown Option: "), 
			                    React.createElement("div", {className: "col-sm-3"}, 
			                        React.createElement("input", {className: "form-control", type: "text", id: "newSelectOption"})
			                    ), 
			                    React.createElement("input", {className: "btn btn-default", type: "button", value: "Add option", onClick: this.addOption.bind(this, false)}), 
			                    React.createElement("input", {className: "btn btn-default", type: "button", value: "Reset", onClick: this.resetOptions})
			                ), 
			                    React.createElement("div", {className: "form-group"}, 
			                        React.createElement("label", {className: "col-sm-2 control-label"}, "Preview: "), 
			                        React.createElement("div", {className: "col-sm-2"}, 
			                            React.createElement("select", {id: "selectOptions", className: "form-control"}, 
			                            	this.state.options.map(function(option){
			                            		return (
			                            			React.createElement("option", null, 
			                            				option
			                            			)
			                            		)
			                            	})
			                            )
			                    )
			                )
			            ), 
			            React.createElement("div", {id: "multiselectoptions", className: "options"}, 
			                React.createElement("div", {className: "form-group"}, 
			                    React.createElement("label", {className: "col-sm-2 control-label"}, " Option: "), 
			                    React.createElement("div", {className: "col-sm-3"}, 
			                        React.createElement("input", {className: "form-control", type: "text", id: "newmultiSelectOption"})
			                    ), 
			                    React.createElement("input", {className: "btn btn-default", type: "button", value: "Add option", onClick: this.addOption.bind(this, true)}), 
			                    React.createElement("input", {className: "btn btn-default", type: "button", value: "Reset", onClick: this.resetOptions})
			                ), 
			                    React.createElement("div", {className: "form-group"}, 
			                        React.createElement("label", {className: "col-sm-2 control-label"}, "Preview: "), 
			                        React.createElement("div", {className: "col-sm-2"}, 
			                            React.createElement("select", {multiple: true, id: "multiselectOptions", className: "form-control"}, 
			                            	this.state.options.map(function(option){
			                            		return (
			                            			React.createElement("option", null, 
			                            				option
			                            			)
			                            		)
			                            	})
			                            )
			                    )
			                )
			            ), 
			            React.createElement("div", {id: "dateoptions", className: "options form-group"}, 
			                React.createElement("label", {className: "col-sm-2 control-label"}, "Start year: "), 
			                React.createElement("div", {className: "col-sm-2"}, 
			                    React.createElement("input", {className: "form-control", type: "number", id: "datemin", min: "1900", max: "2100"})
			                ), 
			                React.createElement("label", {className: "col-sm-2 control-label"}, "End year: "), 
			                React.createElement("div", {className: "col-sm-2"}, 
			                    React.createElement("input", {className: "form-control", type: "number", id: "datemax", min: "1900", max: "2100"})
			                )
			            ), 
			            React.createElement("div", {id: "numericoptions", className: "options form-group"}, 
			                React.createElement("label", {className: "col-sm-2 control-label"}, "Min: "), 
			                React.createElement("div", {className: "col-sm-2"}, 
			                    React.createElement("input", {className: "form-control", type: "number", id: "numericmin"})
			                ), 
			                React.createElement("label", {className: "col-sm-2 control-label"}, "Max: "), 
			                React.createElement("div", {className: "col-sm-2"}, 
			                    React.createElement("input", {className: "form-control", type: "number", id: "numericmax"})
			                )
			            ), 
			        React.createElement("div", {className: "form-group"}, 
			            React.createElement("div", {className: "col-sm-offset-2 col-sm-10"}, 
			                React.createElement("input", {className: "btn btn-default", type: "button", value: "Add Row", onClick: this.addQuestion})
			            )
			        )


			    )
			)
		)
	}
});

InstrumentBuilderApp = React.createClass({displayName: "InstrumentBuilderApp",
	getInitialState: function() {
	 	return {
	 		elements: [
	 		 	{
	 		 		databaseName: "Database Name",
	 		 		elementType: "Question Display (Front End)"
	 			}
	 		]
	 	};
	},
	addQuestion: function(dbName, elmType){
		this.setState(function(state){
			var temp = state.elements,
				element = {
					databaseName: dbName,
					elementType: elmType
				};
			temp.push(element);
			return {
				elements: temp
			};
		});
	},
	render: function () {
		return (
			React.createElement("div", null, 
				React.createElement("div", {className: "row"}, React.createElement(LoadInstrument, null)), 
				React.createElement(DisplayElements, {
					elements: this.state.elements}
				), 
				React.createElement("div", {className: "row"}, 
					React.createElement(AddElement, {updateQuestions: this.addQuestion})
				), 
				React.createElement("div", {className: "row"}, React.createElement("h1", null, "HELLO WORLD"))
			)
		);
	}
});

RInstrumentBuilderApp = React.createFactory(InstrumentBuilderApp);