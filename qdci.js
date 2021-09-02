/********************
 *  Procedures for +QDCI letters data visualization
 *  by Konstantin.Safronov@sanofi.com for Sanofi, 2020
 */
var
    mData = [],
    dataSiteURL = $().SPServices.SPGetCurrentSite(),
    letter = "+",
    rings = {"o":"outer","m":"middle","i":"inner"};

$.extend({
    /** jQuery extension to taking url variables from URL */
    getUrlVars: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        },
        getUrlVar: function(name){
            return $.getUrlVars()[name];
        }
});

/** To prepare and show bootstrap dialog window for data manipulation */
function showForm(e){
    var id = "";

    $('input[name=kpi]').prop('checked', false); // Clear kpi inputs

    id = e.target.id.slice(0, e.target.id.indexOf("f"));
    console.info(id);
    $('input#keepID').val(id);

    if(typeof(mData[id]) !== 'undefined'){
        console.info('#formModal kpi #'+mData[id]);
        $('input#'+mData[id][0]).prop('checked', true);
        console.info($('input#'+mData[id][0]));
    }
    $('#formModal').modal('show'); 
}
/** To save data input at SharePoint list */
function saveForm(){
    var id = $('input#keepID').val();
    //console.info(rings[id.slice(0,1)]);
    //console.info(moment().date(id.slice(1)).format()," = ",letter," = ",rings[id.slice(0,1)]," = ",$('input[name=kpi]:checked').val());


    if(typeof($('input[name=kpi]:checked')) !== 'undefined'){
        $().SPServices.defaults.webURL = dataSiteURL; // URL of the target Web
        if(typeof(mData[id]) !== 'undefined'){ // Update existing record
            $().SPServices({
                operation: "UpdateListItems",
                async: false,
                listName: "+QDCI",
                ID: mData[id][1],
                valuepairs: [ ['Status',$('input[name=kpi]:checked').val()] ],
                completefunc: function(xData, Status) {
                  //alert("Completed "+Status);
                }
            });
        }else{
        $().SPServices({
            operation: "UpdateListItems",
            listName: "+QDCI",
            batchCmd: "New",
            listProperties:"",
            valuepairs: [
                ["Date", moment().date(id.slice(1)).format()], 
                ["Letter", letter], 
                ["Ring",rings[id.slice(0,1)]],
                ['Status',$('input[name=kpi]:checked').val()]
            ],
            async: false,
            completefunc: function (xData, Status){
                //alert("Completed "+Status);
            }
          });
        }
    }
    visualiseDays();
    $('#formModal').modal('hide');
  
}


/** Data visualisation on circles  */
function visualiseDays(){
    var d;
   
    $(".gd,.rc,.ot").hide(); // Clear marks

    getData();
    for (d=1; d <= moment().daysInMonth(); d++){
      if(moment(d, "DD").format('E') >= 6) {
          $('#o'+d+'f, #m'+d+'f, #i'+d+'f').attr({class: "dayoff-fill"});
      }
    }
    
    for (i in mData){
        if (mData[i][0] == 'holiday') { $('#'+i+'f').attr({class: "dayoff-fill"}); } else {
            $("#"+i+mData[i][0].slice(0, 1)).show();
        }

    }
}

/** Takes data from SharePoint list */
function getData(){
    var 
    query = '<Query><Where>'+
                '<And>'+
                    '<Eq><FieldRef Name="Letter"></FieldRef><Value Type="Text">'+letter+'</Value></Eq>'+
                    '<And><Geq><FieldRef Name="Date"></FieldRef><Value Type="DateTime">'+moment().startOf('month').format()+'</Value></Geq>'+
                    '<Leq><FieldRef Name="Date"></FieldRef><Value Type="DateTime">'+ moment().endOf('month').format() +'</Value></Leq>'+
                '</And></And>'+
            '</Where></Query>';

    mData = []; // Data cleanup
    $().SPServices.defaults.webURL = dataSiteURL; // URL of the target Web
    
    $().SPServices({
        operation: "GetListItems",
        async: false,
        listName: "+QDCI",
        CAMLQuery: query,
        CAMLViewFields: "<ViewFields><FieldRef Name='ID' /><FieldRef Name='Ring' /><FieldRef Name='Date' /><FieldRef Name='Status' /></ViewFields>",
        completefunc: function (xData, Status) {
            $(xData.responseXML).SPFilterNode("z:row").each(function() {
                mData[$(this).attr("ows_Ring")[0]+moment($(this).attr("ows_Date")).format('D')] =  [$(this).attr("ows_Status"),$(this).attr("ows_ID")];
            })
        }
    });
    
}

