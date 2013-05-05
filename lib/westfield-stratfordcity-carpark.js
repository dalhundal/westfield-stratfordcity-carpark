var http = require("http");
var _ = require("underscore");

var WSCCP = module.exports =  function() {

	function request(path,fnCallback) {
		var httpParams = {
			host: 'westfielduk-json.live.i-retail.ibltd.com',
			port: 80,
			path: path
		};
		var req = http.request(httpParams,function(res) {
			res.setEncoding('utf8');
			var chunks = "";
			res.on('data',function(chunk) { chunks = chunks+chunk; });
			res.on('end',function() {
				var parsed = JSON.parse(chunks);
				fnCallback(parsed);
			});
		});
		req.end();
	};

	function allSearchTerms(exhaustive) {
		var plateYears = [];
		for (var iYear=1; iYear<=13; iYear++) {
			var yearString = (iYear<10) ? '0'+iYear : ''+iYear; 
			var a = +yearString.charAt(0);
			var b = +yearString.charAt(1);
			plateYears.push(yearString);
			plateYears.push((''+(a+5)+b));
		};
		var areaCodes = [
			"AA","AB","AC","AD","AE","AF","AG","AH","AJ","AK","AL","AM","AN","AO","AP","AR","AS","AT","AU","AV",
			"AW","AX","AY","BA","BB","BC","BD","BE","BF","BG","BH","BJ","BK","BL","BM","BN","BO","BP","BR","BS",
			"BT","BU","BV","BW","BX","BY","CA","CB","CC","CD","CE","CF","CG","CH","CJ","CK","CL","CM","CN","CO",
			"CP","CR","CS","CT","CU","CV","CW","CX","CY","DA","DB","DC","DD","DE","DF","DG","DH","DJ","DK","DL",
			"DM","DN","DO","DP","DR","DS","DT","DU","DV","DW","DX","DY","EA","EB","EC","ED","EE","EF","EG","EH",
			"EJ","EK","EL","EM","EN","EO","EP","ER","ES","ET","EU","EV","EW","EX","EY","FA","FB","FC","FD","FE",
			"FF","FG","FH","FJ","FK","FL","FM","FN","FO","FP","FR","FS","FT","FU","FV","FW","FX","FY","GA","GB",
			"GC","GD","GE","GF","GG","GH","GJ","GK","GL","GM","GN","GO","GP","GR","GS","GT","GU","GV","GW","GX",
			"GY","HA","HB","HC","HD","HE","HF","HG","HH","HJ","HK","HL","HM","HN","HO","HP","HR","HS","HT","HU",
			"HV","HW","HX","HY","KA","KB","KC","KD","KE","KF","KG","KH","KJ","KK","KL","KM","KN","KO","KP","KR",
			"KS","KT","KU","KV","KW","KX","KY","LA","LB","LC","LD","LE","LF","LG","LH","LJ","LK","LL","LM","LN",
			"LO","LP","LR","LS","LT","LU","LV","LW","LX","LY","MA","MB","MC","MD","ME","MF","MG","MH","MJ","MK",
			"ML","MM","MN","MO","MP","MR","MS","MT","MU","MV","MW","MX","MY","NA","NB","NC","ND","NE","NF","NG",
			"NH","NJ","NK","NL","NM","NN","NO","NP","NR","NS","NT","NU","NV","NW","NX","NY","OA","OB","OC","OD",
			"OE","OF","OG","OH","OJ","OK","OL","OM","ON","OO","OP","OR","OS","OT","OU","OV","OW","OX","OY","PA",
			"PB","PC","PD","PE","PF","PG","PH","PJ","PK","PL","PM","PN","PO","PP","PR","PS","PT","PU","PV","PW",
			"PX","PY","RA","RB","RC","RD","RE","RF","RG","RH","RJ","RK","RL","RM","RN","RO","RP","RR","RS","RT",
			"RU","RV","RW","RX","RY","SA","SB","SC","SD","SE","SF","SG","SH","SJ","SK","SL","SM","SN","SO","SP",
			"SR","SS","ST","SU","SV","SW","SX","SY","VA","VB","VC","VD","VE","VF","VG","VH","VJ","VK","VL","VM",
			"VN","VO","VP","VR","VS","VT","VU","VV","VW","VX","VY","WA","WB","WC","WD","WE","WF","WG","WH","WJ",
			"WK","WL","WM","WN","WO","WP","WR","WS","WT","WU","WV","WW","WX","WY","XA","XB","XC","XD","XE","XF",
			"YA","YB","YC","YD","YE","YF","YG","YH","YJ","YK","YL","YM","YN","YO","YP","YR","YS","YT","YU","YV",
			"YW","YX","YY"
		];
		var searchTerms = [];
		_.each(plateYears,function(plateYear) {
			if (exhaustive) {
				_.each(areaCodes,function(areaCode) {
					searchTerms.push(areaCode+plateYear);
				});
			} else {
				for (var i=0;i<26;i++) {
					searchTerms.push(plateYear+String.fromCharCode(65+i));
				}
			};
		});
		return searchTerms;
	};

	//

	this.isAvailable = function(fnCallback) {
		request('/westfieldstratford/findmycar/status/',function(response) {
			fnCallback(response[0].available=='yes');
		});
	};

	this.findCar = function(regno,fnCallback) {
		request('/westfieldstratford/findmycar/bays.json?visit.plate.text='+regno,function(results) {
			fnCallback(_.map(results,function(result) {
				return {
					aisle: result.aisle,
					image: result.image,
					plate: result.visit.plate.text,
				};
			}));
		});
	};

	this.findAllCars = function(fnCallback,options) {
		var that = this;
		options = _.extend({
			fnProgress: function(progress,current,total,searchTerm) {},
			fnCarFound: function(result) {},
			throttle: true
		},options||{});
		//
		var searchTerms = allSearchTerms();
		var searchTermsTotal = searchTerms.length;
		var iSearchTerm = 0;
		var results = [];
		function searchNextTerm() {
			var searchTerm;
			if (!(searchTerm = searchTerms.pop())) {
				fnCallback(results);
				return;
			};
			iSearchTerm++;
			options.fnProgress((iSearchTerm/searchTermsTotal),iSearchTerm,searchTermsTotal,searchTerm);
			(function(numLeft) {
				that.findCar(searchTerm,function(searchResults) {
					_.each(searchResults,function(searchResult) {
						results.push(searchResult);
						options.fnCarFound(searchResult);
					});
					if (options.throttle) searchNextTerm();
					if (!options.throttle && !numLeft) fnCallback(results);
				});
			})(searchTerms.length);
			if (!options.throttle) searchNextTerm();
		};
		searchNextTerm();
	};

};