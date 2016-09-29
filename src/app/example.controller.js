/*global angular,RiskEvidenceConditionParser */
angular.module('CarreExample')
  .controller('ExampleController', function($scope, $location, API,$sce, $timeout,cfpLoadingBar,CONFIG) {

    //set up the urls 
    var CARRE_DEVICES = API.accounts;
    var testToken = 'e097e48bbc1e35d83f5289a053d088a06188b6f2',token=null;
    if($location.search().token) token = $location.search().token;
    
    //clean up the browser url
    $location.url('/').replace();
    var baseUrl = $location.absUrl();
    $scope.loginUrl = CARRE_DEVICES + '/login?next=' + baseUrl;
    $scope.logoutUrl = CARRE_DEVICES + '/logout?next=' + baseUrl;
    
    // set default visualization type
    $scope.visualizationType = 'list';

    // Retrieving a cookie and set initial user object
    API.user(token).then(function(res) {
      $scope.user = {
        oauth_token: res.oauth_token,
        username: res.username
      };
      $scope.loadData();
    });

    $scope.loadTestUser = function() { 
      API.user(testToken).then(function(res) {
        $scope.user = {
          oauth_token: res.oauth_token,
          username: res.username
        };
        $scope.loadData();
      });
    };

    $scope.loadData = function() {
      $scope.measurements=[];
      $scope.loading = true;
      cfpLoadingBar.start();
      getMeasureListWithLatestValue();
    };

    var results = {};
    
    function getMeasureListWithLatestValue() {

      if (!$scope.user.username) return;
      API.lastMeasurements($scope.user).then(function(res) {
        console.log(res);
        var data = res.data;

        results.predicates = [];
        results.values = {};
        results.observable_names = {};
        results.ob_dates = {};

        data.map(function(obj) {
          results.predicates.push(obj.p.value.replace("http://carre.kmi.open.ac.uk/ontology/sensors.owl#", ":"));
          results.values[makeLabel(obj.ob.value)] = obj.value.value;
          results.observable_names[makeLabel(obj.ob.value)] = obj.ob_name.value;
          results.ob_dates[makeLabel(obj.ob.value)] = obj.date.value;
        });

        //get the risk evidences
        getRiskEvidences();
      }, function(err) { console.log("Error in query measurementList"); console.log(err); });


    }


    function getRiskEvidences() {

      API.risk_evidences($scope.user, results.predicates).then(function(res) {
        var data = res.data;
        results.summary = [];
        results.risk_evidences = {};
        results.educational_resources = [];
        results.risk_element_names = [];
        results.risk_factors = {};
        results.total_risk_evidences = data.length;
        data.forEach(function(rv) {
          var result = RiskEvidenceConditionParser.evaluate(rv.condition.value, results.values);

          //             console.log(
          //               makeLabel(rv.risk_factor.value),
          //               makeLabel(rv.risk_evidence.value),
          //               result,
          //               rv.condition.value,getValues(results.values).join("|"),
          //               "---------"
          //             );


          if (result) {

            var risk_factor = makeLabel(rv.risk_factor.value);
            var risk_evidence = makeLabel(rv.risk_evidence.value);
            var rf_source = makeLabel(rv.has_risk_factor_source.value);
            var rf_target = makeLabel(rv.has_risk_factor_target.value);
            var rf_source_name = makeLabel(rv.rl_source_name.value);
            var rf_target_name = makeLabel(rv.rl_target_name.value);
            var rf_label = makeLabel(rv.rl_source_name.value) + " --> " + makeLabel(rv.rl_target_name.value);
            
            // populate risk element names
            if(results.risk_element_names.indexOf(rf_source_name)===-1) results.risk_element_names.push(rf_source_name);
            if(results.risk_element_names.indexOf(rf_target_name)===-1) results.risk_element_names.push(rf_target_name);
            
            
            results.risk_factors[risk_factor] = results.risk_factors[risk_factor] || {
              label: rf_label,
              source:rf_source,
              target:rf_target,
              evidences: []
            };

            results.risk_factors[risk_factor].evidences.push(risk_evidence);
            results.risk_evidences[risk_evidence] = {
              confidence_interval_min: rv.confidence_interval_min.value,
              confidence_interval_max: rv.confidence_interval_max.value,
              risk_evidence_ratio_value: rv.risk_evidence_ratio_value.value
            };

          }

        });
        console.log(results);
        display(results);
        $scope.loading = false;
        //           console.log(
        //             results.risk_factors,
        //             results.values,
        //             results.summary.length+"/"+results.total_risk_evidences);

      });

    }

    function display(results) {

      $scope.risk_factors = [];
      //make risk factors with evidences
      for (var rf in results.risk_factors) {
        $scope.risk_factors.push({
          label: results.risk_factors[rf].label,
          link: "https://entry.carre-project.eu/risk_factors/" + rf,
          evidences: results.risk_factors[rf].evidences.map(function(ev) {
            return {
              link: "https://entry.carre-project.eu/risk_evidences/" + ev,
              label: ev,
              ratio: results.risk_evidences[ev].risk_evidence_ratio_value
            };
          })
        });
      }
      $scope.measurements = [];
      //make measurements
      for (var ob in results.observable_names) {
        $scope.measurements.push({
          label: results.observable_names[ob],
          link: "https://entry.carre-project.eu/observables/" + ob,
          value: results.values[ob],
          date: new Date(results.ob_dates[ob]).toLocaleString()
        });
      }
      setGraphUrl();
      
      // make educational resources
      $scope.educational=[];
      $scope.educational = results.risk_element_names.map(function(rl){
        return {
          link:'https://edu.carre-project.eu/search/'+encodeURI(rl),
          label:rl
        }
      })
      //select first
      $scope.selectEducational($scope.educational[0].label);

    }
    
    // Change language specific
    $scope.lang=CONFIG.language;
    $scope.changeLanguage = function(){
      CONFIG.language = $scope.lang;
      $scope.loadData();
    }
    
    
    $scope.iframeLoaded=function(){
      $scope.iframesLoaded++;
      if($scope.iframesLoaded===1) {
        cfpLoadingBar.complete();
      }
    };
    
    function setGraphUrl(){
      $scope.iframesLoaded=0;
      
      var base = "//entry.carre-project.eu/";
      // var base = "//beta.carre-project.eu:3000/#/";
      var params = "explore?embed=true&hidemenu=true&showonlygraph=true&elementstype=risk_evidences&lang="+CONFIG.language;
      var url = base+params+"&elements="+Object.keys(results.risk_evidences).join(",");
      $scope.entrysystemUrlSankey = $sce.trustAsResourceUrl(url+"&graphtype=sankey");
      // $scope.entrysystemUrlNetwork = $sce.trustAsResourceUrl(url+"&graphtype=network");
    }


    $scope.selectEducational=function(rl){
      $scope.educationalTerm = rl;
      $scope.showEducational=false;
      cfpLoadingBar.start();
      var base = "//edu.carre-project.eu/search/";
      // var base = "//beta.carre-project.eu:8080/search/";
      var url = base+encodeURI(rl);
      $scope.educationalObjectUrl = $sce.trustAsResourceUrl(url+"?embed=true&lang="+CONFIG.language);
      $timeout(function(){
        $scope.showEducational=true;
        cfpLoadingBar.complete();
      },2000);
    }

    function makeLabel(str) {
      var result = "";
      if (str.indexOf("#") >= 0) {
        result = str.substring(str.lastIndexOf("#") + 1)
          .replace("risk_factor_association_type", "");
      } else result = str.substring(str.lastIndexOf("/") + 1);
      if (result.indexOf("RF_") +
        result.indexOf("OB_") +
        result.indexOf("RV_") +
        result.indexOf("RL_") > -4) return result;
      else return result.replace(/[_-]+/g, " ");
    }
    

  });
  