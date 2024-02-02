export const decompress = async (url: string) => {
    const ds = new DecompressionStream('gzip');
    const response = await fetch(url);
    const blob_in = await response.blob();
    const stream_in = blob_in.stream().pipeThrough(ds);
    const blob_out = await new Response(stream_in).blob();
    return await blob_out.text();
};
  
export const decompressJson = async (url: string) => {
    let result = await decompress(url);
    return JSON.parse(atob(result));
};

export function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function htmlToElement(html: string): ChildNode | null {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

export function modalWithCloseButton(title: string, body: string) {
    modal(title, body, `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>`);
}
  
export function modal(title: string, body: string, footer: string) {
      var myModal = document.getElementById("exampleModal");
  
      var html = `<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div class="modal-dialog">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title" id="exampleModalLabel">` + title +
                      `</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                      </button>
                  </div>
                  <div class="modal-body">` + body + `</div>
                  <div class="modal-footer">` + footer + `</div>
              </div>
          </div>
      </div>`
  
    if (myModal == null) {
        let myModal = htmlToElement(html);
        document.body.appendChild(myModal as Node);
    } else {
        myModal.innerHTML = (htmlToElement(html) as any).innerHTML;
    }
    window.bootstrap.Modal.getOrCreateInstance(myModal as HTMLElement).show(); // Use the 'bootstrap' package to show the modal
  }

export function addTable(container: HTMLElement, id: string) {
    container.innerHTML = "<div class=\"table-toggles\"></div>" +
    "<table id=\"" + id + "\" class=\"locutus-table table compact table-striped table-bordered table-sm\" style=\"width:100%\">" +
    "<thead class=\"table-danger\"><tr></tr></thead>" +
    "<tbody></tbody>" +
    "<tfoot><tr></tr></tfoot>" +
    "</table>";
}

export function setupContainer(container: HTMLElement, data: {columns: string[], data: any[][], searchable: number[], visible: number[], cell_format: {[key: string]: number[];}, row_format: {[key: string]: number[];}, sort: [number, string]}) {
    addTable(container, uuidv4());
    let table = container.getElementsByTagName("table")[0];
    setupTable(container, table, data);
}

export function setupTable(containerElem: HTMLElement, tableElem: HTMLElement, dataSetRoot: {columns: string[], data: any[][], searchable: number[], visible: number[], cell_format: {[key: string]: number[];}, row_format: {[key: string]: number[];}, sort: [number, string]}) {
    let jqContainer = $(containerElem);
    let jqTable = $(tableElem);

    let dataColumns = dataSetRoot["columns"];
    let dataList = dataSetRoot["data"];
    let searchableColumns = dataSetRoot["searchable"];
    let visibleColumns = dataSetRoot["visible"];
    let cell_format = dataSetRoot["cell_format"];
    let row_format = dataSetRoot["row_format"];
    let sort = dataSetRoot["sort"];
    if (sort == null) sort = [0, 'asc'];

    let dataObj: {}[] = [];
	dataList.forEach(function (row, index) {
		let obj: {[key: string]: any} = {}; // Add index signature
		for (let i = 0; i < dataColumns.length; i++) {
			obj[dataColumns[i]] = row[i];
		}
		dataObj.push(obj);
	});
        let cellFormatByCol: { [key: string]: any } = {};
        if (cell_format != null) {
            for (let func in cell_format) {
                let cols: number[] = cell_format[func];
                for (let col of cols) {
                    cellFormatByCol[col] = (window as any)[func] as Function;
                }
            }
        }

    let columnsInfo: { data: string, className: string, render?: any, visible?: boolean }[] = [];
    if (dataColumns.length > 0) {
        for (let i = 0; i < dataColumns.length; i++) {
            let columnInfo: { data: string; className: string; render?: any } = {"data": dataColumns[i], "className": 'details-control'};
            let renderFunc = cellFormatByCol[i];
            if (renderFunc != null) {
                columnInfo["render"] = renderFunc;
            }
            columnsInfo.push(columnInfo);
        }
    }
    for(let i = 0; i < columnsInfo.length; i++) {
        let columnInfo = columnsInfo[i];
        let title = columnInfo["data"];
        if (visibleColumns != null) {
            columnInfo["visible"] = visibleColumns.includes(i) as boolean;
        }
        let th,tf;
        if (title == null) {
            th = '';
            tf = '';
        } else {
            if (searchableColumns == null || searchableColumns.includes(i)) {
                th = '<input type="text" placeholder="'+ title +'" style="width: 100%;" />';
            } else {
                th = title;
            }
            tf = "<button class='toggle-vis btn btn-danger' data-column='" + i + "'>-" + title + "</button>";
        }
        jqTable.find("thead tr").append("<th>" + th + "</th>");
        let rows = jqTable.find("tfoot tr").append("<th>" + tf + "</th>");
        if (typeof columnInfo["visible"] === 'boolean' && columnInfo["visible"] === false) {
            let row = rows.children().last();
            let toggle = row.children().first();
            (toggle[0] as any).oldParent = row[0];
            toggle = jqContainer.find(".table-toggles").append(toggle);
        }
    }

    // table initialization
    let table = (jqTable as any).DataTable( {
        data: dataObj,
        "columns": columnsInfo,
        "order": [sort],
        lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
        initComplete: function () {
            let that = this.api();
            that.columns().every( function (index: number) {
                var column = that.column( index );
                let title = columnsInfo[index]["data"];
                if (title != null) {
                    let data = column.data();
                    let unique = data.unique();
                    let uniqueCount = unique.count();
                    if (uniqueCount > 1 && uniqueCount < 24 && uniqueCount < data.count() / 2 && (searchableColumns == null || searchableColumns.includes(index))) {
                        let select = $('<select><option value=""></option></select>')
                            .appendTo($(column.header()).empty() )
                            .on( 'change', function () {
                                let val = ($.fn as any).dataTable.util.escapeRegex(
                                    $(this).val()
                                );

                                column
                                    .search( val ? '^'+val+'$' : '', true, false )
                                    .draw();
                            });

                        unique.sort().each( function ( d: any, j: any ) {
                            select.append('<option value="'+d+'">'+d+'</option>' );
                        });

                        select.before(title + ": ");
                    }

                }
            });
        }
    });

    // Apply the search
    table.columns().every( function (index: number) {
        var column = table.column( index );
        let myInput = $( 'input', column.header() );
        myInput.on( 'keyup change clear', function () {
            if ( column.search() !== (this as any).value ) {
                column
                    .search((this as any).value )
                    .draw();
            }
        } );
        myInput.click(function(e) {
            e.stopPropagation();
         });
    });

	jqContainer.find('.toggle-vis').on('click', function (e) {
		e.preventDefault();
		// Get the column API object
		let column = table.column( $(this).attr('data-column') );

		// Toggle the visibility
		column.visible( ! column.visible() );
		// move elem
		if (e.target.parentElement && e.target.parentElement.tagName == "TH") {
			(e.target as any).oldParent = e.target.parentElement;
			jqContainer.find(".dataTables_length").after(e.target);
		} else {
			(e.target as any).oldParent.append(e.target);
		}
    });

    /* Formatting function for row details - modify as you need */
	function format (d: any) {
        let rows = "";
        table.columns().every( function (index: any) {
            let columnInfo = columnsInfo[index];
            let title = columnInfo["data"];
            if (title != null) {
                if (!table.column(index).visible()) {
                    rows += '<tr>'+
                        '<td>' + title + '</td>'+
                        '<td>'+d[title]+'</td>'+
                        '</tr>';
                }
            }
        });
        if (rows == "") rows = "No extra info";
        return '<table class="table table-striped table-bordered table-sm" cellspacing="0" border="0">'+rows+'</table>';
    }

    // Add event listener for opening and closing details
    jqTable.find('tbody').on('click', 'td.details-control', function () {
        let tr = $(this).closest('tr');
        let row = table.row( tr );

        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child( format(row.data()) ).show();
            tr.addClass('shown');
        }
    });
}