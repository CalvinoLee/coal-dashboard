(function () {
  "use strict";

  const data = window.COAL_DATA;
  const state = {
    range: 365,
    changeType: "wow",
    section: "全部",
    search: "",
  };

  const chartById = Object.fromEntries(
    data.charts.map((chart) => [chart.id, chart]),
  );

  function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "--";
    }
    const abs = Math.abs(value);
    const digits = abs >= 1000 ? 1 : abs >= 100 ? 1 : 2;
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: digits,
    }).format(value);
  }

  function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "--";
    }
    const percent = value * 100;
    return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
  }

  function changeClass(value) {
    if (value > 0.00001) return "up";
    if (value < -0.00001) return "down";
    return "flat";
  }

  function changeArrow(value) {
    if (value > 0.00001) return "↑";
    if (value < -0.00001) return "↓";
    return "→";
  }

  function latestPoint(series) {
    return series && series.data.length
      ? series.data[series.data.length - 1]
      : null;
  }

  function previousPoint(series) {
    return series && series.data.length > 1
      ? series.data[series.data.length - 2]
      : null;
  }

  function renderKpis() {
    const grid = document.getElementById("kpi-grid");
    grid.innerHTML = data.summaryCards
      .map((item) => {
        const sparkSource =
          item.metric === "CCI5500"
            ? chartById.price.series[0]
            : item.metric.includes("库存")
              ? chartById.inventory.series[0]
              : chartById.power.series[1];
        const latest = latestPoint(sparkSource);
        const previous = previousPoint(sparkSource);
        const sparkChange =
          latest && previous ? (latest.value - previous.value) / previous.value : 0;

        return `
          <article class="kpi-card">
            <div class="kpi-title">
              <span>${item.metric}</span>
              <span>${item.group || item.section}</span>
            </div>
            <div class="kpi-value">
              ${formatNumber(item.current)}
              <span class="kpi-unit">${item.unit}</span>
            </div>
            <div class="kpi-changes">
              <span>环比 <b class="change ${changeClass(item.wow)}">${changeArrow(item.wow)} ${formatPercent(item.wow)}</b></span>
              <span>同比 <b class="change ${changeClass(item.yoy)}">${changeArrow(item.yoy)} ${formatPercent(item.yoy)}</b></span>
            </div>
            <span hidden>${sparkChange}</span>
          </article>
        `;
      })
      .join("");
  }

  function filteredPoints(points, anchorDate) {
    if (state.range === "all" || !points.length) return points;
    const latest = new Date(anchorDate);
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - Number(state.range));
    return points.filter((point) => new Date(point.date) >= cutoff);
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      name,
    );
    Object.entries(attributes).forEach(([key, value]) =>
      element.setAttribute(key, value),
    );
    return element;
  }

  function renderLineChart(container, chart) {
    const chartLatest = Math.max(
      ...chart.series.flatMap((item) =>
        item.data.map((point) => new Date(point.date).getTime()),
      ),
    );
    const series = chart.series
      .map((item) => ({
        ...item,
        data: filteredPoints(item.data, chartLatest),
      }))
      .filter((item) => item.data.length);

    container.innerHTML = "";
    if (!series.length) {
      container.innerHTML = '<div class="chart-empty">暂无可用数据</div>';
      return;
    }

    const width = Math.max(container.clientWidth || 540, 320);
    const height = 274;
    const margin = { top: 16, right: 16, bottom: 30, left: 48 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const allPoints = series.flatMap((item) => item.data);
    const dates = allPoints.map((point) => new Date(point.date).getTime());
    const values = allPoints.map((point) => point.value);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);
    const valuePadding = (maxValue - minValue || Math.abs(maxValue) || 1) * 0.12;
    minValue -= valuePadding;
    maxValue += valuePadding;

    const x = (date) =>
      margin.left +
      ((new Date(date).getTime() - minDate) / (maxDate - minDate || 1)) *
        plotWidth;
    const y = (value) =>
      margin.top +
      (1 - (value - minValue) / (maxValue - minValue || 1)) * plotHeight;

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "none",
      "aria-label": chart.title,
    });
    const defs = svgElement("defs");
    const gradient = svgElement("linearGradient", {
      id: `gradient-${chart.id}`,
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1",
    });
    gradient.appendChild(
      svgElement("stop", {
        offset: "0%",
        "stop-color": series[0].color,
        "stop-opacity": "0.22",
      }),
    );
    gradient.appendChild(
      svgElement("stop", {
        offset: "100%",
        "stop-color": series[0].color,
        "stop-opacity": "0",
      }),
    );
    defs.appendChild(gradient);
    svg.appendChild(defs);

    for (let index = 0; index <= 4; index += 1) {
      const lineY = margin.top + (plotHeight / 4) * index;
      svg.appendChild(
        svgElement("line", {
          x1: margin.left,
          x2: width - margin.right,
          y1: lineY,
          y2: lineY,
          stroke: "#dfe3e1",
          "stroke-width": "1",
        }),
      );
      const labelValue = maxValue - ((maxValue - minValue) / 4) * index;
      const label = svgElement("text", {
        x: margin.left - 8,
        y: lineY + 3,
        fill: "#7b8588",
        "font-size": "9",
        "text-anchor": "end",
      });
      label.textContent = formatNumber(labelValue);
      svg.appendChild(label);
    }

    const tickCount = 4;
    for (let index = 0; index <= tickCount; index += 1) {
      const stamp = minDate + ((maxDate - minDate) / tickCount) * index;
      const tickDate = new Date(stamp);
      const label = svgElement("text", {
        x: margin.left + (plotWidth / tickCount) * index,
        y: height - 8,
        fill: "#7b8588",
        "font-size": "9",
        "text-anchor":
          index === 0 ? "start" : index === tickCount ? "end" : "middle",
      });
      label.textContent = `${tickDate.getFullYear()}-${String(
        tickDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      svg.appendChild(label);
    }

    series.forEach((item, seriesIndex) => {
      const pathData = item.data
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"} ${x(point.date).toFixed(2)} ${y(
              point.value,
            ).toFixed(2)}`,
        )
        .join(" ");

      if (seriesIndex === 0 && item.data.length > 1) {
        const first = item.data[0];
        const last = item.data[item.data.length - 1];
        const areaData = `${pathData} L ${x(last.date)} ${
          margin.top + plotHeight
        } L ${x(first.date)} ${margin.top + plotHeight} Z`;
        svg.appendChild(
          svgElement("path", {
            d: areaData,
            fill: `url(#gradient-${chart.id})`,
          }),
        );
      }

      svg.appendChild(
        svgElement("path", {
          d: pathData,
          fill: "none",
          stroke: item.color,
          "stroke-width": seriesIndex === 0 ? "2.3" : "1.6",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "vector-effect": "non-scaling-stroke",
        }),
      );
    });

    const overlay = svgElement("rect", {
      x: margin.left,
      y: margin.top,
      width: plotWidth,
      height: plotHeight,
      fill: "transparent",
    });
    const guide = svgElement("line", {
      y1: margin.top,
      y2: margin.top + plotHeight,
      stroke: "#647176",
      "stroke-dasharray": "3 3",
      "stroke-width": "1",
      visibility: "hidden",
    });
    svg.appendChild(guide);
    svg.appendChild(overlay);

    overlay.addEventListener("mousemove", (event) => {
      const rect = svg.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * width;
      const ratio = Math.max(0, Math.min(1, (px - margin.left) / plotWidth));
      const targetStamp = minDate + ratio * (maxDate - minDate);
      const valuesAtDate = series.map((item) => {
        let best = item.data[0];
        let distance = Infinity;
        item.data.forEach((point) => {
          const nextDistance = Math.abs(
            new Date(point.date).getTime() - targetStamp,
          );
          if (nextDistance < distance) {
            distance = nextDistance;
            best = point;
          }
        });
        return { item, point: best };
      });
      const primary = valuesAtDate[0].point;
      guide.setAttribute("x1", x(primary.date));
      guide.setAttribute("x2", x(primary.date));
      guide.setAttribute("visibility", "visible");
      showTooltip(
        event,
        `<strong>${primary.date}</strong>${valuesAtDate
          .map(
            ({ item, point }) =>
              `<span style="color:${item.color}">●</span> ${item.name}：${formatNumber(point.value)} ${chart.unit}`,
          )
          .join("<br>")}`,
      );
    });
    overlay.addEventListener("mouseleave", () => {
      guide.setAttribute("visibility", "hidden");
      hideTooltip();
    });

    container.appendChild(svg);
    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.innerHTML = series
      .map(
        (item) => `
          <span class="legend-item">
            <i class="legend-dot" style="background:${item.color}"></i>
            ${item.name}
          </span>
        `,
      )
      .join("");
    container.appendChild(legend);
  }

  const tooltip = document.getElementById("chart-tooltip");

  function showTooltip(event, html) {
    tooltip.innerHTML = html;
    tooltip.style.display = "block";
    const left = Math.min(event.clientX + 14, window.innerWidth - 210);
    const top = Math.max(event.clientY - 74, 10);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  function renderCharts() {
    document.querySelectorAll("[data-chart]").forEach((container) => {
      renderLineChart(container, chartById[container.dataset.chart]);
    });
  }

  function renderSignals() {
    const metrics = data.weeklyMetrics
      .filter(
        (item) =>
          item[state.changeType] !== null &&
          Math.abs(item[state.changeType]) < 2,
      )
      .sort(
        (a, b) =>
          Math.abs(b[state.changeType]) - Math.abs(a[state.changeType]),
      )
      .slice(0, 8);
    const max = Math.max(
      ...metrics.map((item) => Math.abs(item[state.changeType])),
      0.01,
    );
    document.getElementById("signal-bars").innerHTML = metrics
      .map((item) => {
        const value = item[state.changeType];
        const width = Math.min(50, (Math.abs(value) / max) * 50);
        const positive = value >= 0;
        return `
          <div class="signal-row">
            <span class="signal-name" title="${item.metric}">${item.metric}</span>
            <span class="signal-track">
              <i
                class="signal-fill ${positive ? "positive" : "negative"}"
                style="${positive ? "left:50%" : `left:${50 - width}%`};width:${width}%"
              ></i>
            </span>
            <span class="signal-value ${changeClass(value)}">${formatPercent(value)}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderTableFilters() {
    const sections = [
      "全部",
      ...new Set(data.weeklyMetrics.map((item) => item.section).filter(Boolean)),
    ];
    document.getElementById("table-filters").innerHTML = sections
      .map(
        (section) =>
          `<button class="${state.section === section ? "active" : ""}" data-section="${section}">${section}</button>`,
      )
      .join("");
  }

  function renderTable() {
    const rows = data.weeklyMetrics.filter((item) => {
      const sectionMatch =
        state.section === "全部" || item.section === state.section;
      const searchMatch = `${item.metric}${item.group}${item.section}`
        .toLowerCase()
        .includes(state.search.toLowerCase());
      return sectionMatch && searchMatch;
    });

    document.getElementById("metrics-body").innerHTML = rows
      .map(
        (item) => `
          <tr>
            <td class="metric-group">${item.group || item.section}</td>
            <td>${item.metric}</td>
            <td>${formatNumber(item.current)}</td>
            <td>${item.unit}</td>
            <td><span class="pill ${changeClass(item.wow)}">${formatPercent(item.wow)}</span></td>
            <td><span class="pill ${changeClass(item.yoy)}">${formatPercent(item.yoy)}</span></td>
            <td class="metric-group">${item.note || "--"}</td>
          </tr>
        `,
      )
      .join("");
  }

  function bindEvents() {
    document.querySelector(".range-switcher").addEventListener("click", (event) => {
      const button = event.target.closest("[data-range]");
      if (!button) return;
      state.range =
        button.dataset.range === "all" ? "all" : Number(button.dataset.range);
      document
        .querySelectorAll("[data-range]")
        .forEach((item) => item.classList.toggle("active", item === button));
      renderCharts();
    });

    document.querySelector(".mini-toggle").addEventListener("click", (event) => {
      const button = event.target.closest("[data-change]");
      if (!button) return;
      state.changeType = button.dataset.change;
      document
        .querySelectorAll("[data-change]")
        .forEach((item) => item.classList.toggle("active", item === button));
      renderSignals();
    });

    document.getElementById("table-filters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-section]");
      if (!button) return;
      state.section = button.dataset.section;
      renderTableFilters();
      renderTable();
    });

    document.getElementById("metric-search").addEventListener("input", (event) => {
      state.search = event.target.value.trim();
      renderTable();
      document.getElementById("weekly").scrollIntoView({ block: "start" });
    });

    const navItems = [...document.querySelectorAll(".nav-item")];
    const sections = navItems
      .map((item) => document.querySelector(item.getAttribute("href")))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navItems.forEach((item) =>
            item.classList.toggle(
              "active",
              item.getAttribute("href") === `#${entry.target.id}`,
            ),
          );
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderCharts, 120);
    });
  }

  function init() {
    document.getElementById("database-date").textContent =
      data.meta.databaseDate;
    document.getElementById("sidebar-date").textContent =
      `更新至 ${data.meta.weeklyDate}`;
    document.getElementById("footer-source").textContent =
      `${data.meta.source} · ${data.meta.sheetCount} 张工作表`;
    renderKpis();
    renderCharts();
    renderSignals();
    renderTableFilters();
    renderTable();
    bindEvents();
  }

  init();
})();
