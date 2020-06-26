import React from 'react';
import MapViz from './MapViz';
import BarChart from './BarChart';
import PartyScatterChart from './PartyScatterChart';
import ConstituencyTypeColorPalette from '../../Assets/Data/ConstituencyTypeColorPalette.json';
import PartyColorPalette from '../../Assets/Data/PartyColourPalette.json';
import GenderColorPalette from '../../Assets/Data/GenderColorPalette.json';
import * as Constants from './Constants';

const defaultColor = "#FFFFFF00";

/* Template function for currying */
function curry(func) {
  return function curried(...args) {
    if (args.length >= func.length) {
      return func.apply(this, args);
    } else {
      return function (...args2) {
        return curried.apply(this, args.concat(args2));
      }
    }
  };
}

export default class DataVizWrapper extends React.Component {

  getColorFromRatio = (ratio, minColor, maxColor) => {
    var color1 = maxColor;
    var color2 = minColor;
    var hex = function (x) {
      if (x === 256) {
        return 'ff';
      }
      x = x.toString(16);
      return (x.length === 1) ? '0' + x : x;
    };

    var r = Math.ceil(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
    var g = Math.ceil(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
    var b = Math.ceil(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));

    var middle = hex(r) + hex(g) + hex(b);

    return "#" + middle.toString();
  }

  getColorForContinuous = (minColor, maxColor, val, dataFilterOptions) => {
    if (val) {
      return this.getColorFromRatio(val / 100, minColor, maxColor);
    }
    else return defaultColor;
  }

  getColorForContinuousNormalized = (min, max, minColor, maxColor, val, dataFilterOptions) => {
    let ratio;
    if (!val) {
      return '#33ccff';
    }
    if (val >= 0) {
      ratio = val / max;
      return this.getColorFromRatio(ratio, 'ffffff', maxColor);
    }
    else {
      ratio = (val - min) / (- min);
      return this.getColorFromRatio(ratio, minColor, 'ffffff');

    }
  }

  getLegendColorFromPalette = (ColorPalette, vizParameter, d) => {
    let color = "#FFFFFF00";
    for (let i = 0; i < ColorPalette.length; i++) {
      var element = ColorPalette[i];
      if (element[vizParameter] === d) {
        color = element.Color;
        break;
      }
    }

    return color;
  }

  getSortedLegendFromValue = (data, vizParameter, dataFilterOptions) => {
    let vals = data.map((X) => X[vizParameter]);
    let legend = {};
    for (let i = 0; i < vals.length; i++) {
      let val = vals[i].toString();
      if (dataFilterOptions.has(val)) {
        legend[val] = legend[val] ? legend[val] + 1 : 1;
      }
    }

    let SortedKeys = Object.keys(legend).sort(function (a, b) {
      return legend[b] - legend[a];
    });
    let sortedLegend = {};
    for (let i = 0; i < SortedKeys.length; i++) {
      const val = SortedKeys[i];
      sortedLegend[val] = legend[val];
    }

    return sortedLegend;
  }

  render() {
    const { visualization, visualizationType, data, map, electionType, chartMapOptions, dataFilterOptions, assemblyNo, stateName, showMapYearOptions, yearOptions, playChangeYears, onMapYearChange, showChangeMap } = this.props;
    const electionTypeDisplay = electionType === 'GE' ? 'Lok Sabha' : 'Vidhan Sabha';
    const stateNameDisplay = stateName === 'Lok_Sabha' ? '' : stateName.replace(/_/g, " ");

    if (visualizationType === "Map") {
      let title = "";
      let changeMapTitle = "";
      let vizParameter = "";
      let vizChangeParameter = "";
      let ColorPalette = [];
      let legendType = "";
      let discreteLegend = [];
      let getLegendColor;
      let getMapColor;
      let curriedGetLegendColorFromPalette = curry(this.getLegendColorFromPalette);
      let curriedGetColorForContinuous = curry(this.getColorForContinuous);
      let curriedGetColorForContinuousNormalized = curry(this.getColorForContinuousNormalized);
      let minColorNormal = Constants.legendColorCodes.normalMap.minColor;
      let maxColorNormal = Constants.legendColorCodes.normalMap.maxColor;

      switch (visualization) {
        case "winnerCasteMap": {
          title = `Constituency types for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Constituency_Type";
          legendType = "Discrete";
          ColorPalette = ConstituencyTypeColorPalette;
          getMapColor = (val, dataFilterOptions) => {
            return curriedGetLegendColorFromPalette(ColorPalette, vizParameter, val);
          }
          discreteLegend = this.getSortedLegendFromValue(data, vizParameter, dataFilterOptions);
          getLegendColor = curriedGetLegendColorFromPalette(ColorPalette, vizParameter);
          break;
        }

        case "numCandidatesMap": {
          title = `Constituency wise number of candidates contested for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "N_Cand";
          legendType = "Discrete";
          getMapColor = (val, dataFilterOptions) => {
            switch (true) {
              case !val:
                return defaultColor;
              case val < 5 && dataFilterOptions.has('<5'):
                return '#deebf7';
              case val > 15 && dataFilterOptions.has('>15'):
                return '#6baed6';
              case val >= 5 && val <= 15 && dataFilterOptions.has('5-15'):
                return '#08306b';
              default:
                return defaultColor;
            }
          };
          var candidates = data.map((X) => X.N_Cand);
          let legend = {};
          for (let i = 0; i < candidates.length; i++) {
            let val = candidates[i];
            if (val < 5 && dataFilterOptions.has('<5')) {
              legend['<5'] = legend['<5'] ? legend['<5'] + 1 : 1;
            } else if (val > 15 && dataFilterOptions.has('>15')) {
              legend['>15'] = legend['>15'] ? legend['>15'] + 1 : 1;
            } else if (val >= 5 && val <= 15 && dataFilterOptions.has('5-15')) {
              legend['5-15'] = legend['5-15'] ? legend['5-15'] + 1 : 1;
            }
          }

          let SortedKeys = ['<5', '5-15', '>15'];
          let sortedLegend = {};
          for (let i = 0; i < SortedKeys.length; i++) {
            let val = SortedKeys[i];
            if (legend[val]) {
              sortedLegend[val] = legend[val];
            }
          }

          discreteLegend = sortedLegend;
          getLegendColor = d => {
            return d === "<5" ? "#deebf7"
              : d === "5-15" ? "#6baed6"
                : d === ">15" ? "#08306b"
                  : "FFFFFF00";
          };
          break;
        }

        case "voterTurnoutMap": {
          title = `Constituency wise turnout perentages for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          changeMapTitle = `Constituency wise change in turnout perentages for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Turnout_Percentage";
          vizChangeParameter = "Turnout_Change_pct";
          legendType = "Continuous";
          getMapColor = curriedGetColorForContinuous(minColorNormal, maxColorNormal);
          break;
        }

        case "winnerGenderMap": {
          title = `Constituency types for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Sex";
          legendType = "Discrete";
          ColorPalette = GenderColorPalette;
          getMapColor = (val, dataFilterOptions) => {
            return curriedGetLegendColorFromPalette(ColorPalette, vizParameter, val);
          }
          discreteLegend = this.getSortedLegendFromValue(data, vizParameter, dataFilterOptions);
          getLegendColor = curriedGetLegendColorFromPalette(ColorPalette, vizParameter);
          break;
        }

        case "winnerMarginMap": {
          title = `Constituency wise victory margin percentages for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          changeMapTitle = `Constituency wise change in victory margin percentages for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Margin_Percentage";
          vizChangeParameter = "Margin_Change_pct";
          legendType = "Continuous";
          getMapColor = curriedGetColorForContinuous(minColorNormal, maxColorNormal);
          break;
        }

        case "winnerVoteShareMap": {
          title = `Constituency wise vote share percentages of winners for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          changeMapTitle = `Constituency wise change in vote share percentages of winners for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Vote_Share_Percentage";
          vizChangeParameter = "Vote_Share_Change_pct";
          legendType = "Continuous";
          getMapColor = curriedGetColorForContinuous(minColorNormal, maxColorNormal);
          break;
        }

        case "partyVoteShareMap": {
          title = `Constituency wise vote share percentages of winners for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Vote_Share_Percentage";
          legendType = "Continuous";
          getMapColor = curriedGetColorForContinuous(minColorNormal, maxColorNormal);
          break;
        }

        case "partyPositionsMap": {
          title = `Constituency wise vote share percentages of winners for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Position";
          legendType = "Discrete";
          getMapColor = (val, dataFilterOptions) => {
            switch (true) {
              case !val:
                return defaultColor;
              case val === 1 && dataFilterOptions.has('1'):
                return '#0570b0';
              case val === 2 && dataFilterOptions.has('2'):
                return '#74a9cf';
              case val === 3 && dataFilterOptions.has('3'):
                return '#bdc9e1';
              case val > 3 && dataFilterOptions.has('>3'):
                return '#f1eef6';
              default:
                return defaultColor;
            }
          };

          var positions = data.map((X) => X.Position);
          let legend = {};
          for (let i = 0; i < positions.length; i++) {
            let val = positions[i];
            if (val === 1 && dataFilterOptions.has('1')) {
              legend['1'] = legend['1'] ? legend['1'] + 1 : 1;
            } else if (val === 2 && dataFilterOptions.has('2')) {
              legend['2'] = legend['2'] ? legend['2'] + 1 : 1;
            } else if (val === 3 && dataFilterOptions.has('3')) {
              legend['3'] = legend['3'] ? legend['3'] + 1 : 1;
            } else if (val > 3 && dataFilterOptions.has('>3')) {
              legend['>3'] = legend['>3'] ? legend['>3'] + 1 : 1;
            }
          }

          let SortedKeys = ['1', '2', '3', '>3'];
          let sortedLegend = {};
          for (let i = 0; i < SortedKeys.length; i++) {
            let val = SortedKeys[i];
            if (legend[val]) {
              sortedLegend[val] = legend[val];
            }
          }

          discreteLegend = sortedLegend;
          getLegendColor = (d) => {
            return d === "1" ? "#0570b0"
              : d === "2" ? "#74a9cf"
                : d === "3" ? "#bdc9e1"
                  : d === ">3" ? "#f1eef6"
                    : "FFFFFF00";
          };
          break;
        }

        case "winnerMap": {
          title = `Constituency wise winning parties for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Party";
          legendType = "Discrete";
          ColorPalette = PartyColorPalette;
          getMapColor = (val, dataFilterOptions) => {
            return curriedGetLegendColorFromPalette(ColorPalette, vizParameter, val);
          }
          discreteLegend = this.getSortedLegendFromValue(data, vizParameter, dataFilterOptions);
          getLegendColor = curriedGetLegendColorFromPalette(ColorPalette, vizParameter);
          break;
        }

        case "notaTurnoutMap": {
          title = `Constituency wise NOTA vote share percentages for ${electionTypeDisplay} in Assembly #${assemblyNo}`;
          vizParameter = "Nota_Percentage";
          legendType = "Discrete";
          getMapColor = (val, dataFilterOptions) => {
            switch (true) {
              case !val:
                return defaultColor;
              case val > 5 && dataFilterOptions.has('>5%'):
                return '#0570b0';
              case val >= 3 && val <= 5 && dataFilterOptions.has('3%-5%'):
                return '#74a9cf';
              case val >= 1 && val < 3 && dataFilterOptions.has('1%-3%'):
                return '#bdc9e1';
              case val < 1 && dataFilterOptions.has('<1%'):
                return '#f1eef6';
              default:
                return defaultColor;
            }
          };

          let notavs = data.map((X) => X.Nota_Percentage);
          let legend = {};
          for (let i = 0; i < notavs.length; i++) {
            let val = notavs[i];
            if (val > 5 && dataFilterOptions.has('>5%')) {
              legend['>5%'] = legend['>5%'] ? legend['>5%'] + 1 : 1;
            } else if (val < 1 && dataFilterOptions.has('<1%')) {
              legend['<1%'] = legend['<1%'] ? legend['<1%'] + 1 : 1;
            } else if (val >= 3 && val <= 5 && dataFilterOptions.has('3%-5%')) {
              legend['3%-5%'] = legend['3%-5%'] ? legend['3%-5%'] + 1 : 1;
            } else if (val >= 1 && val < 3 && dataFilterOptions.has('1%-3%')) {
              legend['1%-3%'] = legend['1%-3%'] ? legend['1%-3%'] + 1 : 1;
            }
          }

          let SortedKeys = ['<1%', '1%-3%', '3%-5%', '>5%'];
          let sortedLegend = {};
          for (let i = 0; i < SortedKeys.length; i++) {
            let val = SortedKeys[i];
            if (legend[val]) {
              sortedLegend[val] = legend[val];
            }
          }

          discreteLegend = sortedLegend;
          getLegendColor = d => {
            return d === "<1%" ? "#f1eef6"
              : d === "1%-3%" ? "#bdc9e1"
                : d === "3%-5%" ? "#74a9cf"
                  : d === ">5%" ? "#0570b0"
                    : "FFFFFF00";
          };
          break;
        }

        default:
          break;
      }

      if (showChangeMap) {
        let maxVizParameter = Number.NEGATIVE_INFINITY;
        let minVizParameter = Number.POSITIVE_INFINITY;
        for (let index = 0; index < data.length; index++) {
          let val = data[index][vizChangeParameter];
          if (parseFloat(val) > parseFloat(maxVizParameter)) {
            maxVizParameter = val;
          }
          if (parseFloat(val) < parseFloat(minVizParameter)) {
            minVizParameter = val;
          }
        }

        let getMapColorNormalized = curriedGetColorForContinuousNormalized(minVizParameter, maxVizParameter, Constants.legendColorCodes.changeMap.minColor, Constants.legendColorCodes.changeMap.maxColor);

        return <MapViz
          title={changeMapTitle}
          data={data}
          map={map}
          electionType={electionType}
          dataFilterOptions={dataFilterOptions}
          assemblyNo={assemblyNo}
          stateName={stateName}
          showMapYearOptions={showMapYearOptions}
          yearOptions={yearOptions}
          playChangeYears={playChangeYears}
          onMapYearChange={onMapYearChange}
          vizParameter={vizChangeParameter}
          legendType={legendType}
          discreteLegend={discreteLegend}
          getMapColor={getMapColorNormalized}
          getLegendColor={getLegendColor}
          minVizParameter={minVizParameter}
          maxVizParameter={maxVizParameter}
          showChangeMap={showChangeMap}
        />
      }

      else return (
        <MapViz
          title={title}
          data={data}
          map={map}
          electionType={electionType}
          dataFilterOptions={dataFilterOptions}
          assemblyNo={assemblyNo}
          stateName={stateName}
          showMapYearOptions={showMapYearOptions}
          yearOptions={yearOptions}
          playChangeYears={playChangeYears}
          onMapYearChange={onMapYearChange}
          vizParameter={vizParameter}
          legendType={legendType}
          discreteLegend={discreteLegend}
          getMapColor={getMapColor}
          getLegendColor={getLegendColor}
          minVizParameter={0}
          maxVizParameter={100}
          showChangeMap={showChangeMap}
        />
      )
    }
    else if (visualizationType === "Chart") {
      let chartType = "";
      let layout = {};
      let vizParameters = [];
      let vizParameter = "";
      let showAdditionalText = false;
      let getAdditionalText;

      chartMapOptions.forEach(element => {
        let x = element.replace(/_/g, "")
        let found = Array.from(dataFilterOptions).find((item) => {
          return item === x;
        })

        if (found) {
          vizParameters.push({ label: element.replace(/_/g, " "), value: element, dataFilterOptionName: x });
        }
      });

      switch (visualization) {
        case "voterTurnoutChart": {
          chartType = "BarChart";
          layout = {
            title: stateNameDisplay !== "" ? `Voter turnout across years in ${stateNameDisplay} ${electionTypeDisplay}` : `Voter turnout across years in ${electionTypeDisplay}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Turnout in %',
              range: [0, 100],
              autorange: false
            }
          };
          break;
        }

        case "partiesPresentedChart": {
          chartType = "BarChart";
          layout = {
            title: stateNameDisplay !== "" ? `Parties Contested and Represented across years in ${stateName} ${electionType}` : `Parties Contested and Represented across years in ${electionType}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Number of Parties'
            }
          };
          break;
        }

        case "tvoteShareChart": {
          chartType = "PartyScatterChart";
          vizParameter = "Vote_Share_in_Assembly";
          layout = {
            title: stateNameDisplay !== "" ? `Party wise voteshare in all seats across years in ${stateName} ${electionType}` : `Party wise voteshare in all seats across years in ${electionType}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Vote share %',
              range: [0, 100],
              autorange: false
            }
          };
          break;
        }

        case "cvoteShareChart": {
          chartType = "PartyScatterChart";
          vizParameter = "Vote_Share_in_Contested_Seats";
          layout = {
            title: stateNameDisplay !== "" ? `Party wise voteshare in seats contested across years in ${stateName} ${electionType}` : `Party wise voteshare in seats contested across years in ${electionType}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Vote share %',
              range: [0, 100],
              autorange: false
            }
          };
          break;
        }

        case "seatShareChart": {
          chartType = "PartyScatterChart";
          vizParameter = "Seat_Share";
          layout = {
            title: stateNameDisplay !== "" ? `Party wise Strike Rate across years in ${stateName} ${electionType}` : `Party wise Strike Rate across years in ${electionType}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Seat share %',
              range: [0, 100],
              autorange: false
            }
          };

          showAdditionalText = true;
          getAdditionalText = (party, idx) => {
            var y_seats = data.filter(x => x.Party === party).map(x => x.Winners);
            var total_seats = data.filter(x => x.Party === party).map(x => x.Total_Seats_in_Assembly);
            return y_seats[idx] + "/" + total_seats[idx] + " Seats";
          }
          break;
        }

        case "strikeRateChart": {
          chartType = "PartyScatterChart";
          vizParameter = "Strike_Rate";
          layout = {
            title: stateNameDisplay !== "" ? `Party wise Strike Rate across years in ${stateName} ${electionType}` : `Party wise Strike Rate across years in ${electionType}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Strike Rate %',
              range: [0, 100],
              autorange: false
            }
          };
          break;
        }

        case "contestedDepositSavedChart": {
          chartType = "BarChart";
          layout = {
            title: stateNameDisplay !== "" ? `Contested and deposit lost across years in ${stateName} ${electionType}` : `Contested and deposit lost across years in ${electionType}`,
            xaxis: {
              title: 'Year(Assembly Number)'
            },
            yaxis: {
              title: 'Number of Candidates'
            }
          };
          break;
        }

        default:
          break;
      }
      if (chartType === "BarChart") {
        return (
          <BarChart
            layout={layout}
            vizParameters={vizParameters}
            data={data}
            dataFilterOptions={dataFilterOptions}
          />
        )
      }
      else if (chartType === "PartyScatterChart") {
        return (
          <PartyScatterChart
            layout={layout}
            data={data}
            vizParameter={vizParameter}
            showAdditionalText={showAdditionalText}
            getAdditionalText={getAdditionalText}
          />
        )
      }
    }
  }
}
