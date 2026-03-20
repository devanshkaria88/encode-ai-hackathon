import { Injectable, Logger } from '@nestjs/common';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';
import * as fs from 'fs';
import * as path from 'path';

const WIDTH = 800;
const HEIGHT = 500;

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);
  private readonly canvas: ChartJSNodeCanvas;
  private readonly chartDir: string;

  constructor() {
    this.canvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT, backgroundColour: 'white' });
    this.chartDir = path.join(process.cwd(), 'public', 'charts');
    if (!fs.existsSync(this.chartDir)) {
      fs.mkdirSync(this.chartDir, { recursive: true });
    }
  }

  async generate(params: {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    title: string;
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  }): Promise<{ chart_url: string; file_path: string }> {
    const config: ChartConfiguration = {
      type: params.type,
      data: {
        labels: params.labels.map((l) => (l.length > 20 ? l.substring(0, 20) + '...' : l)),
        datasets: params.datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: params.type === 'pie' || params.type === 'doughnut'
            ? COLORS.slice(0, ds.data.length)
            : COLORS[i % COLORS.length],
          borderColor: params.type === 'line' ? COLORS[i % COLORS.length] : undefined,
          borderWidth: params.type === 'line' ? 2 : 1,
          fill: false,
        })),
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: params.title,
            font: { size: 18 },
          },
          legend: {
            display: params.datasets.length > 1 || params.type === 'pie' || params.type === 'doughnut',
          },
        },
      },
    };

    const filename = `chart_${Date.now()}.png`;
    const filePath = path.join(this.chartDir, filename);

    const buffer = await this.canvas.renderToBuffer(config);
    fs.writeFileSync(filePath, buffer);

    this.logger.log(`Chart generated: ${filename}`);

    return {
      chart_url: `/charts/${filename}`,
      file_path: filePath,
    };
  }
}
