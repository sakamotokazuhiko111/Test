const db = require('../config/database');

const departments = ['開発部', '営業部', '人事部', '経理部', '総務部'];

const employees = [
  { name: '田中 太郎', name_kana: 'タナカ タロウ', dept: '開発部', position: 'エンジニア', email: 'tanaka@example.com', phone: '090-1234-5678', hire_date: '2020-04-01', status: 'active' },
  { name: '鈴木 花子', name_kana: 'スズキ ハナコ', dept: '営業部', position: '営業マネージャー', email: 'suzuki@example.com', phone: '090-2345-6789', hire_date: '2018-07-15', status: 'active' },
  { name: '佐藤 次郎', name_kana: 'サトウ ジロウ', dept: '開発部', position: 'シニアエンジニア', email: 'sato@example.com', phone: '090-3456-7890', hire_date: '2015-10-01', status: 'active' },
  { name: '高橋 美咲', name_kana: 'タカハシ ミサキ', dept: '人事部', position: 'HRスペシャリスト', email: 'takahashi@example.com', phone: '090-4567-8901', hire_date: '2019-04-01', status: 'active' },
  { name: '渡辺 健一', name_kana: 'ワタナベ ケンイチ', dept: '経理部', position: '経理担当', email: 'watanabe@example.com', phone: '090-5678-9012', hire_date: '2021-01-10', status: 'active' },
  { name: '伊藤 さくら', name_kana: 'イトウ サクラ', dept: '開発部', position: 'フロントエンドエンジニア', email: 'ito@example.com', phone: '090-6789-0123', hire_date: '2022-04-01', status: 'active' },
  { name: '山本 浩二', name_kana: 'ヤマモト コウジ', dept: '営業部', position: '営業担当', email: 'yamamoto@example.com', phone: '090-7890-1234', hire_date: '2023-04-01', status: 'active' },
  { name: '中村 恵子', name_kana: 'ナカムラ ケイコ', dept: '総務部', position: '総務担当', email: 'nakamura@example.com', phone: '090-8901-2345', hire_date: '2017-06-01', status: 'active' },
  { name: '小林 大輔', name_kana: 'コバヤシ ダイスケ', dept: '開発部', position: 'インフラエンジニア', email: 'kobayashi@example.com', phone: '090-9012-3456', hire_date: '2016-09-01', status: 'active' },
  { name: '加藤 理恵', name_kana: 'カトウ リエ', dept: '経理部', position: '経理マネージャー', email: 'kato@example.com', phone: '090-0123-4567', hire_date: '2014-04-01', status: 'active' },
  { name: '吉田 雄介', name_kana: 'ヨシダ ユウスケ', dept: '開発部', position: 'バックエンドエンジニア', email: 'yoshida@example.com', phone: '080-1234-5678', hire_date: '2021-07-01', status: 'active' },
  { name: '山田 千尋', name_kana: 'ヤマダ チヒロ', dept: '人事部', position: '採用担当', email: 'yamada@example.com', phone: '080-2345-6789', hire_date: '2020-10-01', status: 'active' },
  { name: '松本 義雄', name_kana: 'マツモト ヨシオ', dept: '営業部', position: '営業部長', email: 'matsumoto@example.com', phone: '080-3456-7890', hire_date: '2010-04-01', status: 'active' },
  { name: '井上 美紀', name_kana: 'イノウエ ミキ', dept: '総務部', position: '総務部長', email: 'inoue@example.com', phone: '080-4567-8901', hire_date: '2012-04-01', status: 'active' },
  { name: '木村 拓海', name_kana: 'キムラ タクミ', dept: '開発部', position: 'エンジニア', email: 'kimura@example.com', phone: '080-5678-9012', hire_date: '2023-10-01', status: 'active' },
  { name: '林 直子', name_kana: 'ハヤシ ナオコ', dept: '営業部', position: '営業担当', email: 'hayashi@example.com', phone: '080-6789-0123', hire_date: '2022-07-01', status: 'inactive' },
  { name: '清水 博文', name_kana: 'シミズ ヒロフミ', dept: '開発部', position: 'テックリード', email: 'shimizu@example.com', phone: '080-7890-1234', hire_date: '2013-04-01', status: 'active' },
  { name: '山口 奈々', name_kana: 'ヤマグチ ナナ', dept: '人事部', position: '人事部長', email: 'yamaguchi@example.com', phone: '080-8901-2345', hire_date: '2011-04-01', status: 'active' },
  { name: '松田 浩一', name_kana: 'マツダ コウイチ', dept: '経理部', position: '経理担当', email: 'matsuda@example.com', phone: '080-9012-3456', hire_date: '2024-04-01', status: 'active' },
  { name: '藤井 莉奈', name_kana: 'フジイ リナ', dept: '開発部', position: 'UIデザイナー', email: 'fujii@example.com', phone: '080-0123-4567', hire_date: '2022-01-15', status: 'inactive' },
];

const insertDept = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)');
const getDeptId = db.prepare('SELECT id FROM departments WHERE name = ?');
const insertEmp = db.prepare(`
  INSERT OR IGNORE INTO employees (name, name_kana, department_id, position, email, phone, hire_date, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const dept of departments) {
    insertDept.run(dept);
  }
  for (const emp of employees) {
    const dept = getDeptId.get(emp.dept);
    insertEmp.run(emp.name, emp.name_kana, dept ? dept.id : null, emp.position, emp.email, emp.phone, emp.hire_date, emp.status);
  }
})();

console.log('シードデータを投入しました。');
