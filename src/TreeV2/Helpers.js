export const _assign = Object.assign;
export function shouldConstruct$1(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isGreenElement);
}