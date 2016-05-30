/*global angular,RiskEvidenceConditionParser */
angular.module('CarreExample', ['ngCookies'])
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  })
  .controller('ExampleController', function($scope, $location, API) {

    //set up the urls 
    var CARRE_DEVICES = API.accounts;
    var testToken = '66efc31e652208e257c3781b2a40376084c0a2ac';
    if($location.search().token) testToken = $location.search().token;
    
    //clean up the browser url
    $location.url('/').replace();
    var baseUrl = $location.absUrl();
    $scope.loginUrl = CARRE_DEVICES + '/login?next=' + baseUrl;
    $scope.logoutUrl = CARRE_DEVICES + '/logout?next=' + baseUrl;

    // Retrieving a cookie and set initial user object
    API.user().then(function(res) {
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
      $scope.loading = true;
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
            var rf_label = makeLabel(rv.rl_source_name.value) + " " +
              makeLabel(rv.has_risk_factor_association_type.value) + " " +
              makeLabel(rv.rl_target_name.value);

            results.risk_factors[risk_factor] = results.risk_factors[risk_factor] || {
              label: rf_label,
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

      $scope.loading = false;

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
  