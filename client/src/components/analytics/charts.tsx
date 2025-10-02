import { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import * as d3 from 'd3';

interface CSATGaugeProps {
  value: number; // value between 0 and 100
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