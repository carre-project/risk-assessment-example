angular.module('CarreExample', ['ngCookies'])
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  })
  .controller('ExampleController', function($scope, $cookies, $location,$http) {

    //set up the urls 
    var CARRE_DEVICES = 'https://devices.carre-project.eu/devices/accounts';
    var API = 'https://devices.carre-project.eu/ws/'; 
    
    
    //clean up the browser url
    $location.url('/').replace();
    var baseUrl = $location.absUrl();
    
    $scope.loginUrl = CARRE_DEVICES + '/login?next=' + baseUrl;
    $scope.logoutUrl = CARRE_DEVICES + '/logout?next=' + baseUrl;

    // Retrieving a cookie and set initial user object
    var TOKEN = $cookies.get('CARRE_USER') || '';
    $scope.user = {};
    //validate cookie token with userProfile api function and get username userGraph
    if (TOKEN.length > 0) {
      $http.get(API + 'userProfile?token=' + TOKEN).then(function(res) {
        $scope.user = {
          oauth_token: TOKEN,
          username: res.data.username,
          email: res.data.email
        };
      }, function(err) {
        $scope.user = {};
        console.log(err);
      });
    }
    
    $scope.loadData = function(){
       $("#loading").show();
      //   clear elements
        $('#risk_factors').empty();
        $('#measurements').empty();
      getMeasureListWithLatestValue();
    }
    $scope.loadTestUser = function(){
      $scope.user={
        oauth_token:'66efc31e652208e257c3781b2a40376084c0a2ac',
        username:'duthteam',
      }
      $scope.loadData();
    }
    
    
var results = {};
var prefixes = "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n\
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n\
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n\
        PREFIX : <http://carre.kmi.open.ac.uk/ontology/sensors.owl#> \n\
        PREFIX risk: <http://carre.kmi.open.ac.uk/ontology/risk.owl#> \n\
        PREFIX carreManufacturer: <http://carre.kmi.open.ac.uk/manufacturers/> \n\
        PREFIX carreUsers: <https://carre.kmi.open.ac.uk/users/> \n ";


function getMeasureListWithLatestValue() {
  
    console.log("Get Measurement of List ");

    var query = prefixes +
"SELECT ?date ?p ?value ?ob ?ob_name FROM <https://carre.kmi.open.ac.uk/users/"+$scope.user.username+"> FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n\
{ \n\
SELECT max(?d) as ?date ?p FROM <https://carre.kmi.open.ac.uk/users/"+$scope.user.username+"> WHERE { \n\
        ?m :has_date / :has_value ?d ; ?p ?o . \n\
        ?o :has_value ?v1 . \n\
            FILTER(!(?p = :has_date) && !(?p = :has_start_date)&& !(?p = :has_end_date) && !(?p = :has_sleep_status)) \n\
    } } \n\
?measurement :has_date / :has_value ?date ; ?p ?o . \n\
?o :has_value ?value . ?ob a risk:observable ; risk:has_external_predicate ?p; risk:has_observable_name ?ob_name.  \n\
FILTER (lang(?ob_name)='en') \n\
} \n";
    var url = "https://carre.kmi.open.ac.uk/ws/query?";
    
    url += "token=" + $scope.user.oauth_token + "&sparql=" + encodeURIComponent(query);
    $.ajax({
        dataType: 'json',
        method: "POST",
        url: url,
        async:true,
        success: function(data) {
          
        results.predicates=[];     
        results.values={};
        results.observable_names={};
        results.ob_dates={};
          
          data.map(function(obj){
                 results.predicates.push(obj.p.value.replace("http://carre.kmi.open.ac.uk/ontology/sensors.owl#",":"));    
         results.values[makeLabel(obj.ob.value)]=obj.value.value;
results.observable_names[makeLabel(obj.ob.value)]=obj.ob_name.value;
results.ob_dates[makeLabel(obj.ob.value)]=obj.date.value;
     
    }); 
      
      //get the risk evidences
      getRiskEvidences()
      
        },
        error : function(err) {
                console.log("Error in query measurementList");
                console.log(err);
        }
    });
    
};
  

function getRiskEvidences() {
    console.log("Get RiskEvidences of List ");
var query = prefixes+"SELECT DISTINCT ?risk_evidence ?condition ?confidence_interval_min ?confidence_interval_max ?risk_evidence_ratio_value ?risk_evidence_ratio_type ?risk_factor ?has_risk_factor_source ?has_risk_factor_target ?rl_source_name ?rl_target_name ?has_risk_factor_association_type FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n "+
"  ?risk_evidence a risk:risk_evidence ;  \n "+
"  risk:has_risk_factor ?risk_factor;  \n "+
" risk:has_risk_evidence_ratio_type ?risk_evidence_ratio_type;  \n "+
"   risk:has_risk_evidence_ratio_value ?risk_evidence_ratio_value;  \n "+
"   risk:has_confidence_interval_max ?confidence_interval_max;  \n "+
"   risk:has_confidence_interval_min ?confidence_interval_min;  \n "+
"   risk:has_risk_evidence_observable ?ob ;  \n "+
"   risk:has_observable_condition ?condition .  \n "+
" #details for risk factor  \n "+
" ?risk_factor risk:has_risk_factor_association_type ?has_risk_factor_association_type;  \n "+
" risk:has_risk_factor_source ?has_risk_factor_source;  \n "+
" risk:has_risk_factor_target ?has_risk_factor_target.  \n "+
" ?has_risk_factor_source risk:has_risk_element_name ?rl_source_name.  \n "+
" ?has_risk_factor_target risk:has_risk_element_name ?rl_target_name.   \n "+
" FILTER(lang(?rl_source_name)='en')   \n "+
" FILTER(lang(?rl_target_name)='en')   \n "+
" {  \n "+
"  SELECT ?ob FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n "+
"  ?ob a risk:observable ;  \n "+
"         risk:has_external_predicate ?p.    \n "+
" VALUES ?p {  \n "+results.predicates.join(" ")+" }  \n "+
" }  \n "+
" }  \n "+
" }";
    var url = "https://carre.kmi.open.ac.uk/ws/query?";
  
    url += "token=" + $scope.user.oauth_token + "&sparql=" + encodeURIComponent(query);
    $.ajax({
        dataType: 'json',
        method: "POST",
        url: url,
        async:true,
        success: function(data) {
          
          results.summary=[];          
          results.risk_evidences=[];
          results.risk_factors={};
          results.total_risk_evidences=data.length;
          data.forEach(function(rv){   
            var result=RiskEvidenceConditionParser.evaluate(rv.condition.value,results.values);

//             console.log(
//               makeLabel(rv.risk_factor.value),
//               makeLabel(rv.risk_evidence.value),
//               result,
//               rv.condition.value,getValues(results.values).join("|"),
//               "---------"
//             );
            
            
           if(result) {
            var risk_factor=makeLabel(rv.risk_factor.value);
            var risk_evidence=makeLabel(rv.risk_evidence.value);
             
            var rf_label=makeLabel(rv.rl_source_name.value)+" "+
                makeLabel(rv.has_risk_factor_association_type.value)+" "+
                makeLabel(rv.rl_target_name.value);

    results.risk_factors[risk_factor] =results.risk_factors[risk_factor] || {label:rf_label,evidences:[]}; 
             
             results.risk_factors[risk_factor].evidences.push(risk_evidence); 
             results.risk_evidences.push(risk_evidence);
             
           }
            
          })
          console.log(results);
          display(results);
//           console.log(
//             results.risk_factors,
//             results.values,
//             results.summary.length+"/"+results.total_risk_evidences);
          
        },
        error : function(err) {
                console.log("Error in query RiskEvidences");
                console.log(err);
        }
    });
    
};

function display(results){
  
    //   clear elements
    $('#risk_factors').empty();
    $('#measurements').empty();
  //make risk factors with evidences
  for (var rf in results.risk_factors) {
    var evidences=[];
 results.risk_factors[rf].evidences.forEach(function(ev){ evidences.push('<a target="_blank" href="https://entry.carre-project.eu/risk_evidences/'+ev+'">'+ev+'</a>'); });
    
   $('#risk_factors').append('<li><a target="_blank" href="https://entry.carre-project.eu/risk_factors/'+rf+'">' +results.risk_factors[rf].label+ '</a> with evidences: '+evidences.join(",")+'</li>');
  }
  
  //make measurements
  for (var ob in results.observable_names) {
  $('#measurements').append(
    '<li><a target="_blank" href="https://entry.carre-project.eu/observables/'+ob+'">' +results.observable_names[ob]+ '</a>: '+results.values[ob] +'  <small>   [ '+
    new Date(results.ob_dates[ob]).toLocaleString()+'] </small> </li>'
  )
  }
  
  
       $("#loading").hide();
  
}

function getValues (o) {
  var arr=[];
  for (var p in o){ arr.push(p+"="+o[p])}
  return arr;
}
function makeLabel(str) { 
  var result="";
  if(str.indexOf("#")>=0) {
    result=str.substring(str.lastIndexOf("#")+1)
      .replace("risk_factor_association_type","")
  } else result = str.substring(str.lastIndexOf("/")+1);
  if(result.indexOf("RF_")+
     result.indexOf("OB_")+
     result.indexOf("RV_")+
     result.indexOf("RL_")>-4) return result;
  else return result.replace(/[_-]+/g, " ");
}


  });