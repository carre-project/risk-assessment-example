/*global angular */
angular.module('CarreExample')
  .service('API', function($http, $cookies, $q,CONFIG) {

    //set up the urls 
    var CARRE_DEVICES = 'https://devices.duth.carre-project.eu/devices/accounts';
    var URL = 'https://devices.duth.carre-project.eu/ws/'; 
    var prefixes = "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n\
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n\
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n\
            PREFIX : <http://carre.kmi.open.ac.uk/ontology/sensors.owl#> \n\
            PREFIX risk: <http://carre.kmi.open.ac.uk/ontology/risk.owl#> \n\
            PREFIX carreManufacturer: <http://carre.kmi.open.ac.uk/manufacturers/> \n\
            PREFIX carreUsers: <https://carre.kmi.open.ac.uk/users/> \n ";

    
  this.exports={
    'accounts': CARRE_DEVICES,
    'user': getUser,
    'lastMeasurements': get_lastMeasurements,
    'risk_evidences': get_risk_evidences
  };
  
  function getUser(token){
    var TOKEN = $cookies.get('CARRE_USER') || token || '';
    //validate cookie token with userProfile api function and get username userGraph
    if (TOKEN.length > 0) {
      return $http.get(URL + 'userProfile?token=' + TOKEN).then(function(res) {
        return {
          oauth_token: TOKEN,
          username: res.data.username,
          email: res.data.email
        };
      }, function(err) {
        console.log(err);
        return {}
      });
    } else {
      var r=$q.defer();
      r.reject({})
      return r.promise;
    }
  }
  
  
  function get_lastMeasurements(user) {
  
    console.log("Get Measurement of List ");

    var query = prefixes +
    "SELECT ?date ?p ?value ?ob ?ob_name FROM <https://carre.kmi.open.ac.uk/users/"+user.username+"> FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n\
    { \n\
    SELECT max(xsd:datetime(?d)) as ?date ?p FROM <https://carre.kmi.open.ac.uk/users/"+user.username+"> WHERE { \n\
            ?m :has_date / :has_value ?d ; ?p ?o . \n\
            ?o :has_value ?v1 . \n\
                FILTER(!(?p = :has_date) && !(?p = :has_start_date)&& !(?p = :has_end_date) && !(?p = :has_sleep_status)) \n\
        } GROUP BY ?p } \n\
    ?measurement :has_date / :has_value ?dates ; ?p ?o . \n\
    ?o :has_value ?value . ?ob a risk:observable ; risk:has_external_predicate ?p; risk:has_observable_name ?ob_name.  \n\
    FILTER (lang(?ob_name)='"+CONFIG.language+"') \n\
    FILTER(xsd:datetime(?dates) = ?date) \n\
    } \n";
  
    console.log(query);
    return $http.post(URL+'query?token='+user.oauth_token+'&sparql='+encodeURIComponent(query));
    

  }
  

  
  function get_risk_evidences(user,predicates) {

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
    " FILTER(lang(?rl_source_name)='"+CONFIG.language+"')   \n "+
    " FILTER(lang(?rl_target_name)='"+CONFIG.language+"')   \n "+
    " {  \n "+
    "  SELECT ?ob FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n "+
    "  ?ob a risk:observable ;  \n "+
    "         risk:has_external_predicate ?p.    \n "+
    " VALUES ?p {  \n "+predicates.join(" ")+" }  \n "+
    " }  \n "+
    " }  \n "+
    " }";


    return $http.post(URL+'query?token='+user.oauth_token+'&sparql='+encodeURIComponent(query));
    

  }
  


  
  return this.exports;
  
});