(function () {
  "use strict";

  const data = window.COAL_DATA;
  const metrics = data.weeklyMetrics;

  function getMetric(name) {
    const item = metrics.find((metric) => metric.metric === name);
    if (!item) {
      throw new Error(`Missing weekly metric: ${name}`);
    }
    return item;
  }

  function formatNumber(value, digits = 1) {
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  function value(item, digits = 1, options = {}) {
    let current = item.current;
    if (options.percentUnit) current *= 100;
    return `<strong class="metric-value">${formatNumber(current, digits)}${
      options.noUnit ? "" : item.unit
    }</strong>`;
  }

  function directionClass(value) {
    if (value > 0.00001) return "up";
    if (value < -0.00001) return "down";
    return "flat";
  }

  function ratioChange(change, options = {}) {
    if (options.flatWord && Math.abs(change) < 0.00001) {
      return '<span class="change flat">持平</span>';
    }
    const percent = change * 100;
    const prefix = percent >= 0 ? "+" : "";
    return `<span class="change ${directionClass(change)}">${prefix}${formatNumber(
      percent,
      1,
    )}%</span>`;
  }

  function pointChange(change) {
    if (Math.abs(change) < 0.00001) {
      return '<span class="change flat">持平</span>';
    }
    const prefix = change >= 0 ? "+" : "";
    return `<span class="change ${directionClass(change)}">${prefix}${formatNumber(
      change,
      2,
    )}pct</span>`;
  }

  function dateText(date) {
    return date.replaceAll("-", ".");
  }

  function monthDay(date) {
    const [, month, day] = date.split("-");
    return `${month}${day}`;
  }

  function previousMonthLabel(date) {
    const current = new Date(`${date}T00:00:00`);
    current.setMonth(current.getMonth() - 1);
    return `${current.getMonth() + 1}月`;
  }

  function previousTenDayLabel(period) {
    if (period.endsWith("下旬")) return period.replace("下旬", "中旬");
    if (period.endsWith("中旬")) return period.replace("中旬", "上旬");
    return "上一旬";
  }

  function setCopy(id, html) {
    document.getElementById(id).innerHTML = html;
  }

  const cci5500 = getMetric("CCI5500");
  const liulin = getMetric("CCI柳林低硫");
  const import5500 = getMetric("CCI进口5500");
  const newc = getMetric("纽卡斯尔6000卡");
  const lowVol = getMetric("低挥发主焦煤");

  const coastalInventory = getMetric("沿海八省库存");
  const inlandInventory = getMetric("内陆十七省库存");

  const totalPower = getMetric("旬度日均总发电量");
  const thermalPower = getMetric("旬度日均火电发电量");
  const hydroPower = getMetric("旬度日均水电发电量");
  const coastalBurn = getMetric("沿海八省日耗");
  const inlandBurn = getMetric("内陆十七省日耗");

  const wti = getMetric("WTI原油");
  const brent = getMetric("布伦特原油");
  const ttf = getMetric("荷兰TTF天然气");
  const hh = getMetric("美国Henry Hub天然气");
  const uraniumSpot = getMetric("天然铀现货价格");
  const uraniumContract = getMetric("天然铀长协价格");

  const moltenIron = getMetric("247家日均铁水产量");
  const blastFurnace = getMetric("247家钢铁高炉开工率");
  const chemicalCoal = getMetric("化工行业合计耗煤");

  const issue = monthDay(data.meta.databaseDate);
  const title = `【华泰电新】能源大宗周度数据追踪${issue}`;
  document.title = title;
  document.getElementById("report-title").textContent = title;
  document.getElementById("issue-code").textContent = issue;
  document.getElementById("database-date").textContent = dateText(
    data.meta.databaseDate,
  );
  document.getElementById("weekly-date").textContent = dateText(
    data.meta.weeklyDate,
  );
  document.getElementById("metric-count").textContent = metrics.length;

  setCopy(
    "coal-price-copy",
    `港口5500卡动力煤价格${value(cci5500, 0)}，周度环比${ratioChange(
      cci5500.wow,
    )}，同比${ratioChange(cci5500.yoy)}；山西柳林低硫主焦煤价格${value(
      liulin,
      0,
    )}，周度环比${ratioChange(liulin.wow, {
      flatWord: true,
    })}，同比${ratioChange(liulin.yoy)}；CCI进口5500卡动力煤价格${value(
      import5500,
      0,
    )}，周度环比${ratioChange(import5500.wow)}，同比${ratioChange(
      import5500.yoy,
    )}；NEWC动力煤现货价格${value(newc, 0)}，周度环比${ratioChange(
      newc.wow,
    )}，同比${ratioChange(newc.yoy)}；国际低挥发主焦煤${value(
      lowVol,
      0,
    )}，周度环比${ratioChange(lowVol.wow)}，同比${ratioChange(lowVol.yoy)}。`,
  );

  setCopy(
    "inventory-copy",
    `沿海八省电厂库存${value(coastalInventory, 0)}<span class="annotation">（库存和日耗本周数据为${
      coastalInventory.note
    }平均）</span>，周度环比${ratioChange(
      coastalInventory.wow,
    )}，同比${ratioChange(coastalInventory.yoy)}；内陆十七省电厂库存${value(
      inlandInventory,
      0,
    )}，周度环比${ratioChange(inlandInventory.wow)}，同比${ratioChange(
      inlandInventory.yoy,
    )}。`,
  );

  const powerPeriod = totalPower.note.split("，")[0];
  const previousPowerPeriod = previousTenDayLabel(powerPeriod);
  setCopy(
    "power-copy",
    `${powerPeriod}日均总发电量${value(totalPower, 1)}，相对${previousPowerPeriod}${ratioChange(
      totalPower.wow,
    )}，同比${ratioChange(totalPower.yoy)}；${powerPeriod}日均火电发电量${value(
      thermalPower,
      1,
    )}，相对${previousPowerPeriod}${ratioChange(thermalPower.wow)}，同比${ratioChange(
      thermalPower.yoy,
    )}；${powerPeriod}日均水电发电量${value(
      hydroPower,
      1,
    )}，相对${previousPowerPeriod}${ratioChange(hydroPower.wow)}，同比${ratioChange(
      hydroPower.yoy,
    )}；沿海八省电厂日耗${value(coastalBurn, 0)}<span class="annotation">（本周数据为${
      coastalBurn.note
    }）</span>，周度环比${ratioChange(coastalBurn.wow)}，同比${ratioChange(
      coastalBurn.yoy,
    )}；内陆十七省日耗${value(inlandBurn, 0)}，周度环比${ratioChange(
      inlandBurn.wow,
    )}，同比${ratioChange(inlandBurn.yoy)}。`,
  );

  setCopy(
    "global-energy-copy",
    `WTI原油期货结算价${value(wti, 1)}，周度环比${ratioChange(
      wti.wow,
    )}，同比${ratioChange(wti.yoy)}；Brent原油期货结算价${value(
      brent,
      1,
    )}，周度环比${ratioChange(brent.wow)}，同比${ratioChange(
      brent.yoy,
    )}；TTF天然气${value(ttf, 1)}，周度环比${ratioChange(
      ttf.wow,
    )}，同比${ratioChange(ttf.yoy)}；HH天然气${value(
      hh,
      1,
    )}，周度环比${ratioChange(hh.wow)}，同比${ratioChange(
      hh.yoy,
    )}；天然铀现货价格${value(uraniumSpot, 1)}，周度环比${ratioChange(
      uraniumSpot.wow,
      { flatWord: true },
    )}，同比${ratioChange(uraniumSpot.yoy)}；${previousMonthLabel(
      data.meta.weeklyDate,
    )}长协价格${value(uraniumContract, 1)}，月环比${ratioChange(
      uraniumContract.wow,
    )}，同比${ratioChange(uraniumContract.yoy)}。`,
  );

  setCopy(
    "steel-chemical-copy",
    `247家钢铁企业日均铁水产量${value(
      moltenIron,
      1,
    )}，周度环比${ratioChange(moltenIron.wow)}，同比${ratioChange(
      moltenIron.yoy,
    )}；247家钢铁企业高炉开工率${value(blastFurnace, 1, {
      percentUnit: true,
    })}，周度环比${pointChange(blastFurnace.wow)}，同比${pointChange(
      blastFurnace.yoy,
    )}。主要煤化工品种（甲醇、合成氨、PVC、纯碱、乙二醇）合计耗煤量${value(
      chemicalCoal,
      1,
    )}，周度环比${ratioChange(chemicalCoal.wow)}，同比${ratioChange(
      chemicalCoal.yoy,
    )}。`,
  );

  document.getElementById("source-note-copy").textContent =
    `数据来自 ${data.meta.source}，数据库更新至 ${data.meta.databaseDate}，周度指标基准日为 ${data.meta.weeklyDate}。各指标口径及备注以原始数据库为准。`;
})();
