// spec: TEST_PLAN.md - Scenario 17
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('プランのエクスポートとインポート（JSONファイル）', () => {
  test('JSONファイルとしてエクスポート・インポートできる', async ({ page }) => {
    let downloadPath: string | null = null;

    try {
      // 1. アプリを起動し、プランを作成するための準備
      await page.goto('http://localhost:5173');
      
      // 2. XMLデータの読み込みを待機
      await new Promise(f => setTimeout(f, 3 * 1000));
      
      // 3. Welcomeモーダルをスキップして、メイン画面にアクセス
      await page.getByRole('button', { name: 'スキップ' }).click();
      
      // 4. 代替レシピを持つグラフェンレシピを選択してプランを作成
      await page.getByRole('button', { name: 'グラフェン', exact: true }).click();
      
      // 5. 目標数量を10に設定してプランをより複雑にする
      await page.getByRole('spinbutton').fill('10');
      
      // 6. 増産剤をMk.IIIに設定して設定を変更
      await page.locator('button').filter({ hasText: '増産剤 Mk.III' }).click();
      
      // 7. 💾 保存ボタンをクリックしてドロップダウンメニューを開く
      const saveButton = page.getByRole('button', { name: '💾 保存' });
      await saveButton.click();
      
      // 8. 「ファイル出力」ボタンをクリックしてJSONファイルとしてエクスポート
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'ファイル出力' }).click();
      const download = await downloadPromise;
      
      // ダウンロードされたファイル名を検証
      expect(download.suggestedFilename()).toMatch(/^Plan_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/);
      
      // ファイルをローカルに保存
      downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
      
      // 9. ページをリフレッシュして初期状態に戻す
      await page.goto('http://localhost:5173');
      
      // 10. データ読み込み完了を待機
      await new Promise(f => setTimeout(f, 3 * 1000));
      
      // 注: 以前のテストでブラウザに保存されたプランが復元される可能性があるため、
      // 初期状態の確認はスキップする
      
      // 11. 「📂 読み込み」ボタンをクリックしてJSONファイルをインポート
      await page.getByRole('button', { name: '📂 読み込み' }).click();
      
      // 12. Choose Fileボタンをクリックしてファイル選択ダイアログを開く
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Choose File' }).click();
      const fileChooser = await fileChooserPromise;
      
      // 13. エクスポートされたJSONファイルをアップロードしてプランをインポート
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('読み込みました');
        dialog.accept();
      });
      await fileChooser.setFiles(downloadPath!);
      
      // ダイアログが閉じるまで待機
      await page.waitForTimeout(500);
      
      // 14. 読み込みダイアログを閉じる
      await page.getByRole('button', { name: '閉じる' }).click();
      
      // 15. プランが完全に復元されたことを確認
      // レシピが復元されている
      await expect(page.locator('text=グラフェン').first()).toBeVisible();
      
      // 目標数量が復元されている
      const spinbutton = page.getByRole('spinbutton');
      await expect(spinbutton).toHaveValue('10');
      
      // 増産剤設定が復元されている（Mk.III選択状態）
      await expect(page.locator('button').filter({ hasText: '増産剤 Mk.III' })).toBeVisible();
      
      // 生産チェーンが再計算されている
      await expect(page.getByText('化学プラント × 12.0')).toBeVisible();
      await expect(page.locator('text=12.0').first()).toBeVisible(); // 施設数
      await expect(page.locator('text=28.1 MW').first()).toBeVisible(); // 電力
      
      // 保存ボタンが有効になっている（プランがロードされている証拠）
      await expect(saveButton).toBeEnabled();
      
      // 代替レシピが復元されている
      await expect(page.getByRole('heading', { name: '硫酸' })).toBeVisible();
      await expect(page.getByText('高エネルギーグラファイト').first()).toBeVisible();
    } finally {
      // テスト終了時にエクスポートされたJSONファイルを削除
      if (downloadPath && fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }
    }
  });
});