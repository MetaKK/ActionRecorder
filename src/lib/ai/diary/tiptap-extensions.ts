/**
 * Tiptap 自定义扩展
 * 支持图片、视频、音频等多媒体内容
 * 基于 Apple 设计原则和 Notion 最佳实践
 */

import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * 增强图片扩展 - 支持上传、调整大小、对齐
 */
export const EnhancedImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      align: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/,
        type: this.type,
        getAttributes: (match) => {
          const [, alt, src, title] = match;
          return { src, alt, title };
        },
      }),
    ];
  },
});

/**
 * 视频扩展 - 支持本地视频和视频链接
 */
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      poster: {
        default: null,
      },
      controls: {
        default: true,
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * 音频扩展
 */
export const Audio = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setAudio:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * 文件附件扩展
 */
export const FileAttachment = Node.create({
  name: 'file',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      fileName: {
        default: 'file',
      },
      fileSize: {
        default: null,
      },
      fileType: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'file', class: 'file-attachment' }, HTMLAttributes),
      [
        'a',
        {
          href: HTMLAttributes.src,
          download: HTMLAttributes.fileName,
          class: 'file-link',
        },
        HTMLAttributes.fileName,
      ],
    ];
  },

  addCommands() {
    return {
      setFile:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * 拖拽上传插件
 */
export function DragAndDropPlugin(uploadFn: (file: File) => Promise<string>) {
  const key = new PluginKey('dragAndDrop');

  return new Plugin({
    key,
    props: {
      handleDOMEvents: {
        drop(view, event) {
          const files = Array.from(event.dataTransfer?.files || []);
          if (files.length === 0) return false;

          event.preventDefault();

          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (!pos) return false;

          files.forEach(async (file) => {
            try {
              const url = await uploadFn(file);
              const { schema } = view.state;

              // 根据文件类型插入不同的节点
              let node;
              if (file.type.startsWith('image/')) {
                node = schema.nodes.image?.create({ src: url, alt: file.name });
              } else if (file.type.startsWith('video/')) {
                node = schema.nodes.video?.create({ src: url });
              } else if (file.type.startsWith('audio/')) {
                node = schema.nodes.audio?.create({ src: url, title: file.name });
              } else {
                node = schema.nodes.file?.create({
                  src: url,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                });
              }

              if (node) {
                const transaction = view.state.tr.insert(pos.pos, node);
                view.dispatch(transaction);
              }
            } catch (error) {
              console.error('Upload failed:', error);
            }
          });

          return true;
        },
        dragover(view, event) {
          event.preventDefault();
          return false;
        },
      },
    },
  });
}

/**
 * 粘贴图片插件
 */
export function PasteImagePlugin(uploadFn: (file: File) => Promise<string>) {
  const key = new PluginKey('pasteImage');

  return new Plugin({
    key,
    props: {
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter((item) => item.type.startsWith('image/'));

        if (imageItems.length === 0) return false;

        event.preventDefault();

        imageItems.forEach(async (item) => {
          const file = item.getAsFile();
          if (!file) return;

          try {
            const url = await uploadFn(file);
            const { schema, selection } = view.state;
            const node = schema.nodes.image?.create({ src: url });

            if (node) {
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            }
          } catch (error) {
            console.error('Upload failed:', error);
          }
        });

        return true;
      },
    },
  });
}

/**
 * 上传进度显示插件
 */
export function UploadProgressPlugin() {
  const key = new PluginKey('uploadProgress');

  return new Plugin({
    key,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        // 保持装饰集同步
        set = set.map(tr.mapping, tr.doc);
        
        // 从 meta 中获取上传状态
        const action = tr.getMeta(key);
        if (action?.add) {
          const deco = Decoration.widget(action.pos, () => {
            const span = document.createElement('span');
            span.className = 'upload-progress';
            span.textContent = '上传中...';
            return span;
          });
          set = set.add(tr.doc, [deco]);
        } else if (action?.remove) {
          set = set.remove(set.find(action.pos, action.pos));
        }
        
        return set;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

/**
 * 斜杠命令扩展
 */
export const SlashCommands = Node.create({
  name: 'slashCommands',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slashCommands'),
        props: {
          handleKeyDown(view, event) {
            if (event.key === '/') {
              // 触发斜杠命令菜单
              // 这里可以显示命令面板
              return false;
            }
            return false;
          },
        },
      }),
    ];
  },
});

