import { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTheme } from '@/components/theme-provider';
import * as d3 from 'd3';

interface CSATGaugeProps {
  value: number; // value between 0 and 100
}

interface DataPoint {
  date: Date;
  users: number;
  conversations: number;
  messages: number;
}

interface TimeSeriesChartProps {
  data?: DataPoint[];
}

// Mock data generator
const generateMockData = (timeGranularity: 'hour' | 'day' | 'month'): DataPoint[] => {
  const now = new Date();
  const data: DataPoint[] = [];
  const points = timeGranularity === 'hour' ? 24 : timeGranularity === 'day' ? 30 : 12;
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    if (timeGranularity === 'hour') {
      date.setHours(date.getHours() - i);
    } else if (timeGranularity === 'day') {
      date.setDate(date.getDate() - i);
    } else {
      date.setMonth(date.getMonth() - i);
    }
    
    data.push({
      date,
      users: Math.floor(Math.random() * 1000) + 500,
      conversations: Math.floor(Math.random() * 500) + 200,
      messages: Math.floor(Math.random() * 2000) + 1000,
    });
  }
  
  return data;
};

export function TimeSeriesChart({ data: propData }: TimeSeriesChartProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [timeGranularity, setTimeGranularity] = useState<'hour' | 'day' | 'month'>('day');
  const [visibleLines, setVisibleLines] = useState({
    users: true,
    conversations: true,
    messages: true,
  });
  
  const data = propData || generateMockData(timeGranularity);
  
  const metrics = {
    users: { color: '#3b82f6', label: t('analytics.users', 'Users') },
    conversations: { color: '#10b981', label: t('analytics.conversations', 'Conversations') },
    messages: { color: '#8b5cf6', label: t('analytics.messages', 'Messages') },
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(
        visibleLines.users ? d.users : 0,
        visibleLines.conversations ? d.conversations : 0,
        visibleLines.messages ? d.messages : 0
      )) as number])
      .range([height, 0])
      .nice();

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'x-axis')
      .style('color', theme === 'dark' ? '#94a3b8' : '#64748b')
      .call(d3.axisBottom(x));

    // Add Y axis
    svg.append('g')
      .attr('class', 'y-axis')
      .style('color', theme === 'dark' ? '#94a3b8' : '#64748b')
      .call(d3.axisLeft(y));

    // Line generator
    const line = d3.line<DataPoint>()
      .x(d => x(d.date))
      .curve(d3.curveMonotoneX);

    // Draw lines
    Object.entries(metrics).forEach(([key, { color }]) => {
      if (!visibleLines[key as keyof typeof visibleLines]) return;

      const path = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line.y(d => y(d[key as keyof DataPoint] as number)));

      // Add hover effects
      const focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

      focus.append('circle')
        .attr('r', 4)
        .attr('fill', color);

      svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseover', () => {
          focus.style('display', null);
          if (tooltipRef.current) tooltipRef.current.style.display = 'block';
        })
        .on('mouseout', () => {
          focus.style('display', 'none');
          if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        })
        .on('mousemove', (event) => {
          const bisect = d3.bisector((d: DataPoint) => d.date).left;
          const x0 = x.invert(d3.pointer(event)[0]);
          const i = bisect(data, x0, 1);
          const d0 = data[i - 1];
          const d1 = data[i];
          const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

          focus.attr('transform', `translate(${x(d.date)},${y(d[key as keyof DataPoint] as number)})`);
          
          if (tooltipRef.current) {
            tooltipRef.current.style.left = `${x(d.date) + margin.left + 10}px`;
            tooltipRef.current.style.top = `${y(d[key as keyof DataPoint] as number) + margin.top - 10}px`;
            tooltipRef.current.innerHTML = `
              <div class="font-medium">${metrics[key as keyof typeof metrics].label}</div>
              <div>${d[key as keyof DataPoint]}</div>
              <div class="text-sm text-muted-foreground">
                ${d.date.toLocaleDateString()} ${timeGranularity === 'hour' ? d.date.toLocaleTimeString() : ''}
              </div>
            `;
          }
        });
    });

  }, [data, visibleLines, theme, timeGranularity, t]);

  return (
    <Card className="p-4 glass-chip hover:bg-blue-500/5 transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {Object.entries(metrics).map(([key, { color, label }]) => (
            <Button
              key={key}
              variant="ghost"
              className={`flex items-center gap-2 ${!visibleLines[key as keyof typeof visibleLines] ? 'opacity-50' : ''} hover:bg-blue-500/20 transition-all duration-200`}
              onClick={() => setVisibleLines(prev => ({ ...prev, [key]: !prev[key as keyof typeof visibleLines] }))}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['hour', 'day', 'month'] as const).map((gran) => (
            <Button
              key={gran}
              variant={timeGranularity === gran ? 'default' : 'ghost'}
              size="sm"
              className={timeGranularity === gran ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'hover:bg-blue-500/20'}
              onClick={() => setTimeGranularity(gran)}
            >
              {t(`analytics.timeGranularity.${gran}`, gran.charAt(0).toUpperCase() + gran.slice(1))}
            </Button>
          ))}
        </div>
      </div>
      <div className="relative">
        <svg ref={svgRef} className="w-full" />
        <div
          ref={tooltipRef}
          className="absolute hidden p-2 bg-popover/80 backdrop-blur-sm text-popover-foreground rounded-lg shadow-lg pointer-events-none border"
        />
      </div>
    </Card>
  );
}

export function CSATGauge({ value }: CSATGaugeProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 5, right: 0, bottom: -40, left: 0 };
    const width = 240;
    const height = 160;
    const radius = Math.min(width, height) / 2;
    const barWidth = 25 * width / 300; // Reduced thickness of colored areas
    const chartInset = 5;
    
    // Utility functions
    const percToDeg = (perc: number) => perc * 360;
    const degToRad = (deg: number) => deg * Math.PI / 180;
    const percToRad = (perc: number) => degToRad(percToDeg(perc));

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('overflow', 'visible');

    // Add layer for the panel
    const chart = svg.append('g')
      .attr('transform', `translate(${(width + margin.left) / 2}, ${(height + margin.top) / 2})`);

    // Create arcs for different sections
    const createArc = () => 
      d3.arc()
        .innerRadius(radius - chartInset - barWidth)
        .outerRadius(radius - chartInset);

    // Add the colored arcs
    const totalPercent = 0.75; // For 270 degrees
    const padRad = 0.025;
    
    // Create four sections
    const sections = [
      { class: 'chart-first', color: '#3B82F6' },   // Blue
      { class: 'chart-second', color: '#FACC15' },  // Yellow
      { class: 'chart-third', color: '#FB923C' },   // Orange
      { class: 'chart-fourth', color: '#EF4444' }   // Red
    ];

    sections.forEach((section, i) => {
      const arc = createArc();
      const startPercent = totalPercent + (i * 0.125);
      const endPercent = startPercent + 0.125;

      arc.startAngle(percToRad(startPercent) + (i > 0 ? padRad : 0))
         .endAngle(percToRad(endPercent));

      chart.append('path')
        .attr('class', section.class)
        .attr('d', arc as any)
        .style('fill', section.color);
    });

    // Add the needle
    const needleLength = width / 3;  // Shorter needle
    const needleRadius = needleLength / 12;  // Thinner needle base

    const calculateNeedlePath = (percent: number) => {
      const thetaRad = percToRad(percent / 2);
      const centerX = 0, centerY = 0;
      const topX = centerX - needleLength * Math.cos(thetaRad);
      const topY = centerY - needleLength * Math.sin(thetaRad);
      const leftX = centerX - needleRadius * Math.cos(thetaRad - Math.PI / 2);
      const leftY = centerY - needleRadius * Math.sin(thetaRad - Math.PI / 2);
      const rightX = centerX - needleRadius * Math.cos(thetaRad + Math.PI / 2);
      const rightY = centerY - needleRadius * Math.sin(thetaRad + Math.PI / 2);
      return `M ${leftX} ${leftY} L ${topX} ${topY} L ${rightX} ${rightY}`;
    };

    // Add needle center
    chart.append('circle')
      .attr('class', 'needle-center')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', needleRadius)
      .style('fill', '#000000');

    // Add needle
    const needle = chart.append('path')
      .attr('class', 'needle')
      .attr('d', calculateNeedlePath(0))
      .style('fill', '#000000');

    // No scale labels as requested

    // Animate needle to value
    const percentValue = value / 100;
    needle.transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attrTween('d', () => {
        const interpolate = d3.interpolate(0, percentValue);
        return (t: number) => calculateNeedlePath(interpolate(t));
      });

    // Add percentage below pointer
    chart.append('text')
      .text(`${value}%`)
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14')
      .attr('font-weight', 'bold')
      .style('fill', '#FFFFFF');

  }, [value, t]);

  return (
    <Card className="p-2 glass-chip hover:bg-blue-500/5 transition-all duration-200 h-full">
      <div className="flex items-center justify-center h-full min-h-[160px]">
        <div className="relative flex justify-center items-center">
          <svg ref={svgRef} className="overflow-visible"></svg>
        </div>
      </div>
    </Card>
  );
}