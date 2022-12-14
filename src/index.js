// eslint-disable-next-line require-jsdoc
import Uploader from './uploader';
import Ui from './ui';
import buttonIcon from './svg/button-icon.svg';
require('./index.css').toString();

// eslint-disable-next-line require-jsdoc
export default class SimpleAfterBeforeTool {
  /**
   * @param {AfterBeforeToollData} data - previously saved data
   * @param {AfterBeforeToolConfig} config - user config for Tool
   * @param {object} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;
    this.data = data;
    this.IconClose = '<svg class="icon icon--cross" width="12px" height="12px"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#cross"></use></svg>';
    this.config = {
      endpoints: config.endpoints || '',
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || 'image',
      types: config.types || 'image/*',
      captionPlaceholder: this.api.i18n.t('Caption'),
      buttonContent: config.buttonContent || 'Add Image',
      uploader: config.uploader || undefined,
    };
    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error)
    });

    /**
     * Module for working with UI
     */
    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: () => {
        this.uploader.uploadSelectedFile({
          onPreview: (src) => {
            this.ui.showPreloader(src);
          },
        });
      },
    });
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'cdxcarousel-wrapper',
      addButton: 'cdxcarousel-addImage',
      block: 'cdxcarousel-block',
      uploadBlock: 'cdxcarousel-uploadBlock',
      item: 'cdxcarousel-item',
      removeBtn: 'cdxcarousel-removeBtn',
      leftBtn: 'cdxcarousel-leftBtn',
      rightBtn: 'cdxcarousel-rightBtn',
      inputUrl: 'cdxcarousel-inputUrl',
      inputMeta: 'cdxcarousel-inputMeta',
      caption: 'cdxcarousel-caption',
      list: 'cdxcarousel-list',
      imagePreloader: 'image-tool__image-preloader',
      inputUpload: 'image-tool__input',
      inputUploadTitle: 'image-tool__input_title'
    };
  };

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      title: 'AfterBeforeTool',
      icon: '<?xml version="1.0" encoding="utf-8"?>\n' +
          '<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
          '<svg version="1.1" style="width: 20px" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
          '\t viewBox="131 -131 512 512" style="enable-background:new 131 -131 512 512;" xml:space="preserve">\n' +
          '<g id="XMLID_6_">\n' +
          '\t<path id="XMLID_11_" d="M340.9-84.6H223.8c-25.8,0-46.4,20.6-46.4,46.4v326.4c0,25.8,20.6,46.4,46.4,46.4h116.4V381h47.1v-512\n' +
          '\t\th-46.4L340.9-84.6L340.9-84.6z M340.9,265.3H223.8l116.4-140v140H340.9z M550.9-84.6H433.8v46.4h116.4v303.5l-116.4-140v210h116.4\n' +
          '\t\tc25.8,0,46.4-20.6,46.4-46.4V-38.2C597.3-64,576.7-84.6,550.9-84.6z"/>\n' +
          '</g>\n' +
          '</svg>\n'
    };
  }

  /**
   * Renders Block content
   * @public
   *
   * @return {HTMLDivElement}
   */
  render() {
    /*
     * Structure
     * <wrapper>
     *  <list>
     *    <item/>
     *    ...
     *  </list>
     *  <addButton>
     * </wrapper>
     */
    // ?????????????? ???????? ?????? ????????????
    this.wrapper = make('div', [ this.CSS.wrapper ]);
    this.list = make('div', [ this.CSS.list ]);
    this.addButton = this.createAddButton();

    this.uploadInput = this.createUploadInput();

    this.list.appendChild(this.addButton);
    this.wrapper.appendChild(this.list);

    const images = Array.isArray(this.data) ? this.data: (this.data.images || []);

    if (images.length > 0) {
      for (const load of images) {
        const loadItem = this.creteNewItem(load);

        this.list.insertBefore(loadItem, this.addButton);
      }
    }

    return this.wrapper;
  }

  /**
   * @returns {Element}
   */
  createUploadInput() {
    const input = make('div', [ this.CSS.inputUpload ], {
      contentEditable: true
    });

    input.placeholder = 'https://drive.google.com/file/d/xxxxx/view?usp=sharing';

    input.oninput = () => {
      let value = this.uploadInput.innerHTML;

      if (value.indexOf('view') !== -1) {
        this.uploadInput.style.opacity = '0.2';
        this.uploadInput.style.pointerEvents = 'none';

        this.list.insertBefore(this.creteNewItem({}), this.addButton);

        this.uploader.uploadByUrl(this.uploadInput.innerHTML);

        this.uploadInput.innerHTML = '';
        this.uploadInput.style.opacity = '1';
        this.uploadInput.style.pointerEvents = 'auto';
      }
    };

    return input;
  }

  // eslint-disable-next-line require-jsdoc
  save(blockContent) {
    const list = blockContent.getElementsByClassName(this.CSS.item);
    const images = [];

    if (list.length > 0) {
      for (const item of list) {
        const imgData = {};

        const url = item.firstChild.value;

        const caption = item.lastChild.value;
        const metaEl = item.querySelector(`.${this.CSS.inputMeta}`);

        if (metaEl && metaEl.value) {
          Object.assign(imgData, JSON.parse(metaEl.value));
        }

        Object.assign(imgData, {url, caption});

        if (item.firstChild.value) {
          images.push(imgData);
        }
      }
    }

    return Object.assign({}, {images});
  }

  /**
   * @param savedData
   * @returns {boolean}
   */
  validate(savedData) {
    if (savedData.images.length > 2 || savedData.images.length < 2 ){
      return false;
    }

    return true;
  }

  /**
   * Create Image block
   * @public
   *
   * @param {Object} data - data of saved or upload image
   *
   * Structure
   * <item>
   *  <url/>
   *  <removeButton/>
   *  <img/>
   *  <caption>
   * </item>
   *
   * @return {HTMLDivElement}
   */
  creteNewItem(data) {
    // Create item, remove button and field for image url
    const block = make('div', [ this.CSS.block ]);
    const item = make('div', [ this.CSS.item ]);
    const removeBtn = make('div', [ this.CSS.removeBtn ]);
    const imageUrl = make('input', [ this.CSS.inputUrl ]);
    const imagePreloader = make('div', [ this.CSS.imagePreloader ]);

    imageUrl.value = data.url;

    removeBtn.innerHTML = this.IconClose;
    removeBtn.addEventListener('click', () => {
      block.remove();
      this.wrapper.querySelector('.cdxcarousel-addImage').style.display = 'flex';
    });
    removeBtn.style.display = 'none';

    item.appendChild(imageUrl);
    item.appendChild(removeBtn);
    block.appendChild(item);
    /*
     * If data already yet
     * We create Image view
     */
    if (data.url) {
      this._createImage(data, item, data.caption || '', removeBtn);
    } else {
      item.appendChild(imagePreloader);
    }

    return block;
  }

  /**
   * Create Image View
   * @public
   *
   * @param {Object} file - file of saved or upload image
   * @param {HTMLDivElement} item - block of created image
   * @param {string} captionText - caption of image
   * @param {HTMLDivElement} removeBtn - button for remove image block
   *
   * @return {HTMLDivElement}
   */
  _createImage(file, item, captionText, removeBtn) {
    const image = document.createElement('img');
    const meta = make('input', [this.CSS.inputMeta, this.CSS.input]);

    image.src = file.url;

    const metaData = {};

    Object.keys(file).filter(k => !['url', 'caption'].includes(k)).forEach(k => {
      metaData[k] = file[k];
    });
    meta.value = JSON.stringify(metaData);

    removeBtn.style.display = 'flex';

    item.appendChild(image);
    item.appendChild(meta);
  }

  /**
   * File uploading callback
   * @private
   *
   * @param {Response} response
   */
  onUpload(response) {
    if (response.success && response.file) {
      this._createImage(response.file, this.list.childNodes[this.list.childNodes.length - 2].firstChild, '', this.list.childNodes[this.list.childNodes.length - 2].firstChild.childNodes[1]);
      this.list.childNodes[this.list.childNodes.length - 2].firstChild.childNodes[2].style.backgroundImage = '';
      this.list.childNodes[this.list.childNodes.length - 2].firstChild.firstChild.value = response.file.url;
      this.list.childNodes[this.list.childNodes.length - 2].firstChild.classList.add('cdxcarousel-item--empty');

      if (this.wrapper.querySelectorAll('.cdxcarousel-list .cdxcarousel-item').length >= 2) {
        this.wrapper.querySelector('.cdxcarousel-addImage').style.display = 'none';
      }
    } else {
      this.uploadingFailed('incorrect response: ' + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   * @private
   *
   * @param {string} errorText
   */
  uploadingFailed(errorText) {
    console.error('EditorJS - AfterBeforeTool: uploading failed because of', errorText);

    this.list.childNodes[this.list.childNodes.length - 2].remove();

    this.api.notifier.show({
      message: this.api.i18n.t('Can not upload an image, try another'),
      style: 'error'
    });
  }

  /**
   * Shows uploading preloader
   * @param {string} src - preview source
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;
  }

  // eslint-disable-next-line require-jsdoc
  onSelectFile() {
    // ?????????????? ??????????????
    this.uploader.uploadSelectedFile({
      onPreview: (src) => {
        const newItem = this.creteNewItem({});

        newItem.firstChild.lastChild.style.backgroundImage = `url(${src})`;

        this.list.insertBefore(newItem, this.addButton);
      }
    });
  }

  /**
   * Create add button
   * @private
   */
  createAddButton() {
    const addButton = make('div', [this.CSS.button, this.CSS.addButton]);
    const block = make('div', [this.CSS.block, this.CSS.uploadBlock]);

    addButton.innerHTML = `${buttonIcon} ${this.config.buttonContent}`;
    addButton.addEventListener('click', () => {
      this.onSelectFile();
    });

    block.appendChild(addButton);

    return block;
  }
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {array|string} classNames  - list or name of CSS class
 * @param  {Object} attributes        - any attributes
 * @return {Element}
 */
export const make = function make(tagName, classNames = null, attributes = {}) {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    el[attrName] = attributes[attrName];
  }

  return el;
};
