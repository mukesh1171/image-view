function processImage(inImg) {
    const width = inImg.width;
    const height = inImg.height;
    const src = new Uint32Array(inImg.data.buffer);

    // Brightness
    processCanvas('canvasBrightness', width, height, function(dst) {
      let delta = parseInt($("#rangeBrightness").val());
      for (let i = 0; i < dst.length; i++) {
        let r = src[i] & 0xFF;
        let g = (src[i] >> 8) & 0xFF;
        let b = (src[i] >> 16) & 0xFF;
        
        r += delta;
        g += delta;
        b += delta;
        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;
        
        dst[i] = (src[i] & 0xFF000000) | (b << 16) | (g << 8) | r;
      }
    });

    // Saturation
    processCanvas('canvasSaturation', width, height, function(dst) {
      let value = parseInt($("#rangeSaturation").val());
      let max = (value < 0) ? 255 : 128;
      for (let i = 0; i < dst.length; i++) {
        let r = src[i] & 0xFF;
        let g = (src[i] >> 8) & 0xFF;
        let b = (src[i] >> 16) & 0xFF;
        let gray = (r * 0.2126 + g * 0.7152 + b * 0.0722);
        
        r += (r - gray) * value / max;
        g += (g - gray) * value / max;
        b += (b - gray) * value / max;
        
        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;
  
        dst[i] = (src[i] & 0xFF000000) | (b << 16) | (g << 8) | r;
      }
      
    });

  // Contrast
  processCanvas('canvasContrast', width, height, function(dst) {
    let delta = parseInt($("#rangeContrast").val()) / 255;
    
    let avgGray = 0;
    for (let i = 0; i < dst.length; i++) {
      let r = src[i] & 0xFF;
      let g = (src[i] >> 8) & 0xFF;
      let b = (src[i] >> 16) & 0xFF;
      avgGray += (r * 0.2126 + g * 0.7152 + b * 0.0722);
    }
    avgGray /= dst.length;
    
    for (let i = 0; i < dst.length; i++) {
      let r = src[i] & 0xFF;
      let g = (src[i] >> 8) & 0xFF;
      let b = (src[i] >> 16) & 0xFF;
      
      // let gray = (r * 0.2126 + g * 0.7152 + b * 0.0722);
      let gray = avgGray;

      r += (r - gray) * delta;
      g += (g - gray) * delta;
      b += (b - gray) * delta;
      
      if (r > 255) r = 255;
      else if (r < 0) r = 0;
      if (g > 255) g = 255;
      else if (g < 0) g = 0;
      if (b > 255) b = 255;
      else if (b < 0) b = 0;

      dst[i] = (src[i] & 0xFF000000) | (b << 16) | (g << 8) | r;
    }
    });
    // Conv
    processCanvas('canvasConvolutionMatrix', width, height, function(dst) {
      const kernelSize = 3;
      const halfSize = Math.floor(kernelSize / 2);
      // Fill kernel
      let kernel = new Array(kernelSize);
      for (let y = 0; y < kernelSize; y++) {
        kernel[y] = new Array(kernelSize).fill(0);
        for (let x = 0; x < kernelSize; x++) {
          const inputId = "#kernel" + (y + 1) + "" + (x + 1);
          kernel[y][x] = parseFloat($(inputId).val()) || 0;
        }
      }
      let div = parseFloat($('#div').val()) || 1;
      if (div <= 0.0) {
        div = 1.0;
      }
      let offset = parseInt($('#offset').val()) || 0;
      
      let dstIndex = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0;
          for (let sy = 0; sy < kernelSize; sy++) {
            const yy = Math.min(height - 1, Math.max(0, y + sy - halfSize));
            for (let sx = 0; sx < kernelSize; sx++) {
              const xx = Math.min(width - 1, Math.max(0, x + sx - halfSize));
              let pix = src[yy * width + xx];
              
              r += (pix & 0xFF) * kernel[sy][sx];
              g += ((pix >> 8) & 0xFF) * kernel[sy][sx];
              b += ((pix >> 16) & 0xFF) * kernel[sy][sx];
            }
          }
          
          const a = src[y * width + x] & 0xFF000000;
          r = Math.min(255, Math.max(0, offset + (r / div))) & 0xFF;
          g = Math.min(255, Math.max(0, offset + (g / div))) & 0xFF;
          b = Math.min(255, Math.max(0, offset + (b / div))) & 0xFF;
          
          dst[dstIndex++] = a | (b << 16) | (g << 8) | r;
        }
      }
    });
  }
  
  function getImageData(el) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const img = document.getElementById(el);
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, img.width, img.height);
  }
  
  function processCanvas(canvasId, width, height, func) {
    const canvas = document.getElementById(canvasId);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const outImg = ctx.createImageData(width, height);
    const dst = new Uint32Array(outImg.data.buffer);
    func(dst);
    ctx.putImageData(outImg, 0, 0);
  }
  
  
  
  document.getElementById('input').addEventListener('change', function() {
    if (this.files && this.files[0]) {
      var img = document.getElementById('img');
      img.src = URL.createObjectURL(this.files[0]);
      img.onload = update;
    }
  });
  $('#presets').on('change', function(e) {
    const values = $(this).val().split(' ');
    const size = Math.sqrt(values.length - 2) >> 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        $('#kernel' + (y + 1) + "" + (x + 1)).val(values[y * size + x]);
      }
    }
    $('#div').val(values[values.length - 2]);
    $('#offset').val(values[values.length - 1]);
    update();
  });
  
  
  $("#rangeBrightness").on('input change', update);
  $("#rangeSaturation").on('input change', update);
  $("#rangeContrast").on('input change', update);
  $('input[type="text"]').on('change', update);
  
  function update(e) {

    $('#valueSaturation').text($("#rangeSaturation").val());
    $('#valueBrightness').text($("#rangeBrightness").val());
    $('#valueContrast').text($("#rangeContrast").val());
    processImage(getImageData('img'));

  }
  
  update();