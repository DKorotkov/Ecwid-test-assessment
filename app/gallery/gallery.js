export class Egallary {
   constructor(className) {
      this.className = className;
      this.gallery = document.querySelector(`.${className}`);
      this.init();
   }

   init() {
      if (!this.gallery) {
         console.error(`Class ${this.className} not found on page`);
         return;
      }
      // Load dependencies
      this.loadDepend();
      this.gallery.addEventListener("click", (e) => this.clickOnGallery(e));

      this.gallery.addEventListener("dragover", (event) => {
         this.startDrag(event);
      });
      this.gallery.addEventListener("dragenter", (event) => {
         this.startDrag(event);
      });
      this.gallery.addEventListener("drop", (event) => {
         event.stopPropagation();
         event.preventDefault();
         this.loadByDrop(event);
         this.stopDrag();
      });
      this.gallery.addEventListener("dragleave", () => {
         this.stopDrag();
      });
   }

   loadDepend() {
      const head = document.getElementsByTagName("head")[0];
      const path = this.retrieveURL("gallery.min");
      if (!path) {
         console.error("gallery.min.js not find");
         return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = path + "/css/gallery.min.css";
      head.appendChild(link);

      const xhr = new XMLHttpRequest();
      const gl = this.gallery;
      xhr.open("GET", path + "/html/template.html", true);
      xhr.onreadystatechange = function () {
         if (this.readyState !== 4) return;
         if (this.status !== 200) return;
         gl.innerHTML = this.responseText;
      };
      xhr.send();
   }

   startDrag(event) {
      event.stopPropagation();
      event.preventDefault();
      // event.dataTransfer.dropEffect = "copy";
      this.gallery.classList.add(`${this.className}--drag-start`);
   }

   stopDrag() {
      this.gallery.classList.remove(`${this.className}--drag-start`);
   }

   loadByDrop(event) {
      const files = [...event.dataTransfer.files];
      files.forEach((file) => {
         const reader = new FileReader();
         reader.onload = (event) => {
            this.addImage(event.target.result);
         };
         reader.readAsDataURL(file);
      });
   }

   clickOnGallery(event) {
      const target = event.target;
      const inputLoad = this.gallery.querySelector(`.${this.className}__input-load`);
      const inputFile = this.gallery.querySelector(`.${this.className}__input-file`);

      if (target.classList.contains(`${this.className}__button-load`)) {
         if (inputFile)
            inputFile.addEventListener("change", (e) => {
               const file = e.target.files[0];
               if (!file) return;
               // inputLoad.value = file.name;
               let reader = new FileReader();
               reader.readAsText(file);
               reader.onerror = function () {
                  console.error(reader.error);
                  return;
               };
               reader.onload = () => {
                  try {
                     const imgData = JSON.parse(reader.result)["galleryImages"];
                     imgData.forEach((image) => {
                        this.addImage(image.url, image.width, image.height);
                     });
                  } catch (e) {
                     console.error(e.message);
                     console.error("The data in the file does not contain a JSON object");
                     return;
                  }
               };
               inputFile.value = "";
            });

         if (inputLoad.value !== "") {
            this.addImage(inputLoad.value);
         } else {
            inputFile.click();
         }
      }

      if (target.classList.contains(`${this.className}__image-btn-delete`) || target.classList.contains(`${this.className}__image-btn-delete-icon`)) {
         const imageWrapper = this.closest(target, `.${this.className}__image-wrapper`);
         this.checkCountImages();
         imageWrapper.remove();
      }
   }

   addImage(url, width = null, height = null) {
      this.gallery.classList.add(`${this.className}--active`);
      const imgsList = this.gallery.querySelector(`.${this.className}__imgs-list`);

      const template = this.gallery.querySelector(`.${this.className}__template-image`);
      const clone = template.content.cloneNode(true);
      const imgWr = clone.querySelector(`.${this.className}__image-wrapper`);

      const image = new Image(width, height);
      image.classList.add("e-gallery__image");
      image.src = url;

      if (width === null || height === null) {
         imgWr.classList.add(`${this.className}__image-loading`);
         image.onerror = () => {
            imgWr.remove();
            this.checkCountImages();
         };
         image.onload = () => {
            imgWr.classList.remove(`${this.className}__image-loading`);
         };
      }

      imgWr.prepend(image);
      imgsList.prepend(clone);
   }

   checkCountImages() {
      const wrappers = [...this.gallery.querySelectorAll(`.${this.className}__image-wrapper`)];
      if (wrappers.length <= 1) this.gallery.classList.remove(`${this.className}--active`);
   }

   // Находит родителя по селектору
   closest(el, selector) {
      if (Element.prototype.closest) {
         return el.closest(selector);
      }
      let parent = el;
      while (parent) {
         if (parent.matches(selector)) {
            return parent;
         }
         parent = parent.parentElement;
      }
      return null;
   }

   // Находит путь к файлу js
   retrieveURL = function (filename) {
      var scripts = document.getElementsByTagName("script");
      if (scripts && scripts.length > 0) {
         for (var i in scripts) {
            if (scripts[i].src && scripts[i].src.match(new RegExp(filename + "\\.js$"))) {
               return scripts[i].src.replace(new RegExp("(.*)" + filename + "\\.js$"), "$1");
            }
         }
      }
   };
}
