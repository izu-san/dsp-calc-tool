import { describe, it, expect } from 'vitest';
import { generateExportFilename } from '../filenameGenerator';

describe('filenameGenerator', () => {
  describe('generateExportFilename', () => {
    it('基本的なファイル名生成', () => {
      const filename = generateExportFilename('My Plan', 'json');
      expect(filename).toMatch(/^My_Plan_\d{8}_\d{4}\.json$/);
    });

    it('Markdown形式のファイル名生成', () => {
      const filename = generateExportFilename('Production Plan', 'md');
      expect(filename).toMatch(/^Production_Plan_\d{8}_\d{4}\.md$/);
    });

    it('Excel形式のファイル名生成', () => {
      const filename = generateExportFilename('Excel Export', 'xlsx');
      expect(filename).toMatch(/^Excel_Export_\d{8}_\d{4}\.xlsx$/);
    });

    it('CSV形式のファイル名生成', () => {
      const filename = generateExportFilename('CSV Data', 'csv');
      expect(filename).toMatch(/^CSV_Data_\d{8}_\d{4}\.csv$/);
    });

    it('画像形式のファイル名生成', () => {
      const filename = generateExportFilename('Screenshot', 'png');
      expect(filename).toMatch(/^Screenshot_\d{8}_\d{4}\.png$/);
    });

    it('特殊文字を含むプラン名のサニタイズ', () => {
      const filename = generateExportFilename('Plan*with/special:chars?', 'json');
      expect(filename).toMatch(/^Planwithspecialchars_\d{8}_\d{4}\.json$/);
    });

    it('スペースがアンダースコアに置換される', () => {
      const filename = generateExportFilename('My Test Plan', 'json');
      expect(filename).toMatch(/^My_Test_Plan_\d{8}_\d{4}\.json$/);
    });

    it('日本語文字が除去される', () => {
      const filename = generateExportFilename('テストプラン', 'json');
      expect(filename).toMatch(/^_\d{8}_\d{4}\.json$/);
    });

    it('英数字とアンダースコア、ハイフンは保持される', () => {
      const filename = generateExportFilename('Plan_123-test', 'json');
      expect(filename).toMatch(/^Plan_123-test_\d{8}_\d{4}\.json$/);
    });

    it('空のプラン名でもファイル名が生成される', () => {
      const filename = generateExportFilename('', 'json');
      expect(filename).toMatch(/^_\d{8}_\d{4}\.json$/);
    });

    it('日付と時刻が正しいフォーマットで出力される', () => {
      const filename = generateExportFilename('Test', 'json');
      const match = filename.match(/Test_(\d{8})_(\d{4})\.json/);
      expect(match).toBeTruthy();
      if (match) {
        const dateStr = match[1];
        const timeStr = match[2];
        expect(dateStr).toHaveLength(8); // YYYYMMDD
        expect(timeStr).toHaveLength(4); // HHMM
      }
    });
  });
});
