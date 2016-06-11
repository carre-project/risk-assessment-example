angular.module("CarreExample",["ngCookies","ngSanitize","ngAnimate","cfp.loadingBar","ngOnload"]).config(["$locationProvider","$compileProvider",function(e,a){e.html5Mode(!0),a.debugInfoEnabled(!1)}]).constant("CONFIG",{language:"en"}),function(e,a,r,n,t,s,o){e.GoogleAnalyticsObject=t,e[t]=e[t]||function(){(e[t].q=e[t].q||[]).push(arguments)},e[t].l=1*new Date,s=a.createElement(r),o=a.getElementsByTagName(r)[0],s.async=1,s.src=n,o.parentNode.insertBefore(s,o)}(window,document,"script","https://www.google-analytics.com/analytics.js","ga"),ga("create","UA-60507179-3","auto"),ga("send","pageview"),angular.module("CarreExample").controller("ExampleController",["$scope","$location","API","$sce","$timeout","cfpLoadingBar","CONFIG",function(e,a,r,n,t,s,o){function i(){e.user.username&&r.lastMeasurements(e.user).then(function(e){var a=e.data;p.predicates=[],p.values={},p.observable_names={},p.ob_dates={},a.map(function(e){p.predicates.push(e.p.value.replace("http://carre.kmi.open.ac.uk/ontology/sensors.owl#",":")),p.values[l(e.ob.value)]=e.value.value,p.observable_names[l(e.ob.value)]=e.ob_name.value,p.ob_dates[l(e.ob.value)]=e.date.value}),c()},function(e){})}function c(){r.risk_evidences(e.user,p.predicates).then(function(a){var r=a.data;p.summary=[],p.risk_evidences={},p.educational_resources=[],p.risk_element_names=[],p.risk_factors={},p.total_risk_evidences=r.length,r.forEach(function(e){var a=RiskEvidenceConditionParser.evaluate(e.condition.value,p.values);if(a){var r=l(e.risk_factor.value),n=l(e.risk_evidence.value),t=l(e.has_risk_factor_source.value),s=l(e.has_risk_factor_target.value),o=l(e.rl_source_name.value),i=l(e.rl_target_name.value),c=l(e.rl_source_name.value)+" --> "+l(e.rl_target_name.value);-1===p.risk_element_names.indexOf(o)&&p.risk_element_names.push(o),-1===p.risk_element_names.indexOf(i)&&p.risk_element_names.push(i),p.risk_factors[r]=p.risk_factors[r]||{label:c,source:t,target:s,evidences:[]},p.risk_factors[r].evidences.push(n),p.risk_evidences[n]={confidence_interval_min:e.confidence_interval_min.value,confidence_interval_max:e.confidence_interval_max.value,risk_evidence_ratio_value:e.risk_evidence_ratio_value.value}}}),_(p),e.loading=!1})}function _(a){e.risk_factors=[];for(var r in a.risk_factors)e.risk_factors.push({label:a.risk_factors[r].label,link:"https://entry.carre-project.eu/risk_factors/"+r,evidences:a.risk_factors[r].evidences.map(function(e){return{link:"https://entry.carre-project.eu/risk_evidences/"+e,label:e,ratio:a.risk_evidences[e].risk_evidence_ratio_value}})});e.measurements=[];for(var n in a.observable_names)e.measurements.push({label:a.observable_names[n],link:"https://entry.carre-project.eu/observables/"+n,value:a.values[n],date:new Date(a.ob_dates[n]).toLocaleString()});u(),e.educational=[],e.educational=a.risk_element_names.map(function(e){return{link:"https://edu.carre-project.eu/search/"+encodeURI(e),label:e}}),e.selectEducational(e.educational[0].label)}function u(){e.iframesLoaded=0;var a="//entry.carre-project.eu/",r="explore?embed=true&hidemenu=true&showonlygraph=true&elementstype=risk_evidences&lang="+o.language,t=a+r+"&elements="+Object.keys(p.risk_evidences).join(",");e.entrysystemUrlSankey=n.trustAsResourceUrl(t+"&graphtype=sankey")}function l(e){var a="";return a=e.indexOf("#")>=0?e.substring(e.lastIndexOf("#")+1).replace("risk_factor_association_type",""):e.substring(e.lastIndexOf("/")+1),a.indexOf("RF_")+a.indexOf("OB_")+a.indexOf("RV_")+a.indexOf("RL_")>-4?a:a.replace(/[_-]+/g," ")}var d=r.accounts,k="66efc31e652208e257c3781b2a40376084c0a2ac",m=null;a.search().token&&(m=a.search().token),a.url("/").replace();var v=a.absUrl();e.loginUrl=d+"/login?next="+v,e.logoutUrl=d+"/logout?next="+v,e.visualizationType="list",r.user(m).then(function(a){e.user={oauth_token:a.oauth_token,username:a.username},e.loadData()}),e.loadTestUser=function(){r.user(k).then(function(a){e.user={oauth_token:a.oauth_token,username:a.username},e.loadData()})},e.loadData=function(){e.measurements=[],e.loading=!0,s.start(),i()};var p={};e.lang=o.language,e.changeLanguage=function(){o.language=e.lang,e.loadData()},e.iframeLoaded=function(){e.iframesLoaded++,1===e.iframesLoaded&&s.complete()},e.selectEducational=function(a){e.educationalTerm=a,e.showEducational=!1,s.start();var r="//edu.carre-project.eu/search/",i=r+encodeURI(a);e.educationalObjectUrl=n.trustAsResourceUrl(i+"?embed=true&lang="+o.language),t(function(){e.showEducational=!0,s.complete()},2e3)}}]),angular.module("CarreExample").service("API",["$http","$cookies","$q","CONFIG",function(e,a,r,n){function t(n){var t=a.get("CARRE_USER")||n||"";if(t.length>0)return e.get(c+"userProfile?token="+t).then(function(e){return{oauth_token:t,username:e.data.username,email:e.data.email}},function(e){return{}});var s=r.defer();return s.reject({}),s.promise}function s(a){var r=_+"SELECT ?date ?p ?value ?ob ?ob_name FROM <https://carre.kmi.open.ac.uk/users/"+a.username+"> FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n    { \n    SELECT max(?d) as ?date ?p FROM <https://carre.kmi.open.ac.uk/users/"+a.username+"> WHERE { \n            ?m :has_date / :has_value ?d ; ?p ?o . \n            ?o :has_value ?v1 . \n                FILTER(!(?p = :has_date) && !(?p = :has_start_date)&& !(?p = :has_end_date) && !(?p = :has_sleep_status)) \n        } } \n    ?measurement :has_date / :has_value ?date ; ?p ?o . \n    ?o :has_value ?value . ?ob a risk:observable ; risk:has_external_predicate ?p; risk:has_observable_name ?ob_name.  \n    FILTER (lang(?ob_name)='"+n.language+"') \n    } \n";return e.post(c+"query?token="+a.oauth_token+"&sparql="+encodeURIComponent(r))}function o(a,r){var t=_+"SELECT DISTINCT ?risk_evidence ?condition ?confidence_interval_min ?confidence_interval_max ?risk_evidence_ratio_value ?risk_evidence_ratio_type ?risk_factor ?has_risk_factor_source ?has_risk_factor_target ?rl_source_name ?rl_target_name ?has_risk_factor_association_type FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n   ?risk_evidence a risk:risk_evidence ;  \n   risk:has_risk_factor ?risk_factor;  \n  risk:has_risk_evidence_ratio_type ?risk_evidence_ratio_type;  \n    risk:has_risk_evidence_ratio_value ?risk_evidence_ratio_value;  \n    risk:has_confidence_interval_max ?confidence_interval_max;  \n    risk:has_confidence_interval_min ?confidence_interval_min;  \n    risk:has_risk_evidence_observable ?ob ;  \n    risk:has_observable_condition ?condition .  \n  #details for risk factor  \n  ?risk_factor risk:has_risk_factor_association_type ?has_risk_factor_association_type;  \n  risk:has_risk_factor_source ?has_risk_factor_source;  \n  risk:has_risk_factor_target ?has_risk_factor_target.  \n  ?has_risk_factor_source risk:has_risk_element_name ?rl_source_name.  \n  ?has_risk_factor_target risk:has_risk_element_name ?rl_target_name.   \n  FILTER(lang(?rl_source_name)='"+n.language+"')   \n  FILTER(lang(?rl_target_name)='"+n.language+"')   \n  {  \n   SELECT ?ob FROM <http://carre.kmi.open.ac.uk/riskdata> WHERE {  \n   ?ob a risk:observable ;  \n          risk:has_external_predicate ?p.    \n  VALUES ?p {  \n "+r.join(" ")+" }  \n  }  \n  }  \n  }";return e.post(c+"query?token="+a.oauth_token+"&sparql="+encodeURIComponent(t))}var i="https://devices.carre-project.eu/devices/accounts",c="https://devices.carre-project.eu/ws/",_="PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n            PREFIX : <http://carre.kmi.open.ac.uk/ontology/sensors.owl#> \n            PREFIX risk: <http://carre.kmi.open.ac.uk/ontology/risk.owl#> \n            PREFIX carreManufacturer: <http://carre.kmi.open.ac.uk/manufacturers/> \n            PREFIX carreUsers: <https://carre.kmi.open.ac.uk/users/> \n ";return this.exports={accounts:i,user:t,lastMeasurements:s,risk_evidences:o},this.exports}]);
//# sourceMappingURL=../maps/scripts/app-542755501a.js.map
