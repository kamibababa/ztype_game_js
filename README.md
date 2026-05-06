# zType Clone (M1-M4)

一个基于 `HTML5 Canvas + Vanilla JavaScript` 的 `zType` 风格打字射击游戏复刻项目。

## 当前状态

- `M1` 最小可玩版本：已完成
- `M2` 手感增强：已完成
- `M3` 体验完善：已完成
- `M4` 基础工程化：已完成

## 功能清单

- 敌人携带单词下落
- 首字母锁定 + 连续输入击杀
- 子弹与爆炸粒子反馈
- 连击与倍率计分
- 难度随时间提升（词库分层 + 刷新参数）
- 生命、结算、重开
- 开始页与暂停/继续
- 音效开关（WebAudio）
- 本地最高分（`localStorage`）

## 快速开始

### 方式 1：直接打开

直接用浏览器打开 `index.html`。

### 方式 2：本地静态服务器（推荐）

```bash
npx serve .
```

## 操作说明

- `a-z`：输入字母攻击
- `Space`：开始 / 暂停 / 继续
- `音效按钮`：静音切换

说明：建议使用英文输入法游玩。

## 测试

```bash
npm test
```

当前包含最小单元测试：

- 词库权重分段逻辑
- 目标选择逻辑（同首字母优先最危险）
- 连击倍率计算与上限

## 目录结构

```text
ztypegamelab/
  index.html
  style.css
  README.md
  openspec.zh-CN.md
  package.json
  src/
    main.js
    state.js
    words.js
    audio.js
    entities/
      effects.js
    systems/
      combat.js
      render.js
      spawn.js
      storage.js
      update.js
  tests/
    combat.test.js
    words.test.js
```

## 已知限制

- 当前为纯前端本地存档，没有在线排行榜。
- 音效由 WebAudio 实时合成，不包含外部音频素材。
- 暂未实现触屏专用输入方案（移动端可浏览但不适合高强度输入）。

## 后续可选扩展

- 背景音乐与更多音色包
- 词库配置面板与难度预设
- 在线排行榜与玩家档案
- 更细的模块测试与 CI
