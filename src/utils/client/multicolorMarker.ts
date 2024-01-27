import L from "leaflet";

L.Canvas.include({
  _updateMulticolorMarker: function (layer: any) {
    if (!this._drawing || layer._empty()) {
      return;
    }

    const p: { x: number; y: number } = layer._point;
    const ctx = this._ctx;
    const radius: number = Math.max(Math.round(layer._radius), 1);
    const colors: string[] = layer.options.colors;

    const angle = 360 / colors.length;

    for (let index = 0; index < colors.length; index++) {
      ctx.fillStyle = `${colors[index]}`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.arc(
        p.x,
        p.y,
        radius,
        (index * angle * Math.PI) / 180,
        ((index + 1) * angle * Math.PI) / 180
      );
      ctx.closePath();
      ctx.fill();
    }
  },
});

export const MulticolorMarker = L.Circle.extend({
  options: {
    colors: ["d33d81"],
  },
  _updatePath: function () {
    this._renderer._updateMulticolorMarker(this);
  },
});
