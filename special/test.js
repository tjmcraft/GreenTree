const root = document.getElementById("root");

(function test_old() {

  class Clock extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.state = { date: new Date().toUTCString() };
    }
    tick() {
      this.setState({ date: new Date().toUTCString() });
    }
    create() {
      return GreenTree.createElement('div', { class: ['clock', this.props.cust], "data-date": this.state.date, "data-hash": this.props.data }, `${this.state.date}`);
    }
    componentDidMount() {
      //setInterval(() => this.tick(), 1000);
    }
  }

  class ClassElement extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.state = {data: "nohash"};
    }
    tick() {
      this.setState({ data: Math.random().toString().substring(2,8) });
    }
    create() {
      return GreenTree.createElement(Clock, { cust: 'green', cp: this.props.customProperty, data: this.state.data });
    }
    componentDidMount() {
      //setTimeout(() => this.tick(), 1000);
    }
  }

  class ClassElementWithProps extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      console.debug('ClassElementWithProps:', this);
    }
    create() {
      return this.props.children;
    }
  }

  const var_element = GreenTree.createElement('div', { class: 'var-element' }, 'var element')

  const function_element = function (props) {
    return GreenTree.createElement('div', { class: 'function-element' }, 'function element');
  }

  let ref_test = {};

  const root_element =
    GreenTree.createElement('root', { ref: ref_test }, // Ref test
      GreenTree.createElement('span', { class: ['first', 'second'], customProperty: 'lol' }, // Element with custom property
        "Basic TEXT", // RAW text
        GreenTree.createElement(ClassElement, { customProperty: '5347' }), // Class Element
        //GreenTree.createElement(ClassElementWithProps, { prop: 1 }, ["Child1", "Child2"]), // Empty Class
        //["Child1", "Child2"], // Array Element
        null, // Null Element
        //GreenTree.createElement('span', { unsafeHTML: true }, "<a>hello</a>"), // Raw HTML Element
        //GreenTree.createElement('svg', { ns: 'http://www.w3.org/2000/svg' }, // SVG Element
        //    GreenTree.createElement('circle', { ns: 'http://www.w3.org/2000/svg', cx: 50, cy: 50, r: 10, fill: "red"})
        //),
        //var_element, // Variable Element
        GreenTree.createElement(function_element), // Function Element
      )
    );

  const class_element = GreenTree.createElement(ClassElement, { customProperty: '5347' });
  //const clock_element = GreenTree.createElement(Clock, {clockProps: "5248"})
  //const text_element = GreenTree.createElement("div", {class: "textTest"}, "Hello world!");
  const element = class_element;

  //console.debug('Ref:', ref_test)
  //console.debug('Element:', element)

  window._el = element;

  //root.innerHTML = JSON.stringify(class_element, null, 2);

  //GreenTree.Render(element, root);
});

(function test_new() {

  class Clock extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.state = { date: new Date().toUTCString() };
    }
    tick() {
      this.setState({ date: Math.floor(performance.now()) });
    }
    componentDidMount() {
      console.warn('>> componentDidMount', this.state);
      setTimeout(() => this.tick(), 1000);
    }
    componentDidUpdate(oldProps) {
      console.warn('>> componentDidUpdate', this.state);
    }
    componentWillUnmount() {
      console.warn('>> componentWillUnmount', this.state);
    }
    create() {
      console.warn('>> render', this.state);
      return GreenTree.createElement('div', { class: ['clock', 'sep'] },
        GreenTree.createElement('h1', null, "Node#", this.props.key),
        GreenTree.createElement('h2', null, `${this.state.date}`)
      );
    }
  }

  class ClassElement extends GreenTree.AbstractElement {
    create() {
      console.debug(">> classEl render");
      return GreenTree.createElement('span', { className: "span-element", cust: this.props.cust }, "text child");
    }
    componentDidMount() {
      console.warn('>> componentDidMount', "ClassElement");
    }
    componentDidUpdate(oldProps) {
      console.warn('>> componentDidUpdate', "ClassElement");
    }
    componentWillUnmount() {
      console.warn('>> componentWillUnmount', "ClassElement");
    }
  }

  class ClassElementRef extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.refTest = GreenTree.createRef();
    }
    create() {
      return (
        GreenTree.createElement('span', { class: "span-element", cust: this.props.cust, ref: this.refTest }, "text child")
      );
    }
    componentDidMount() {
      //setTimeout(() => {
        console.debug("ref", this.refTest);
      //});
    }
  }

  class StateComponent extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.state = { show: false };
    }
    create() {
      console.debug(">> render", this.props.t);
      return !this.state.show ? "show" : (!this.props.sd ? "hide" : null);
    }
    tick() {
      this.setState({ show: true });
      //console.debug(">> tick", this.state);
    }
    componentDidMount() {
      !this.props.dd && setTimeout(() => this.tick(), this.props.t || 1000);
    }
  }

  function Route({path, children}) {
    const [state, setState] = GreenTree.useState(window.location.pathname);
    GreenTree.useEffect(() => {
      const onLocationChange = () => {
        setState(window.location.pathname);
      };
      window.addEventListener("navigate", onLocationChange);
      return () => window.removeEventListener("navigate", onLocationChange);
    }, []);
    return state === path ? children : null;
  }

  class RouteComponent extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.state = {url: "/1"};
    }
    create() {
      return this.state.url == this.props.url ? this.props.children : null;
    }
    tick() {
      this.setState({ url: "/2" });
      console.debug(">> tick", this.props.url == this.state.url);
    }
    componentDidMount() {
      !this.props.dd && setTimeout(() => this.tick(), this.props.t || 1000);
    }
  }

  function function_element(props) {
    const [state, setState] = GreenTree.useState(1);
    GreenTree.useEffect(() => {
      console.debug("effect:", state);
    }, []);
    console.debug("render:", state);
    return (
      GreenTree.createElement('div', { class: "function-element", cust: props.cust },
      GreenTree.createElement('h3', null, "count:\xa0", state),
        GreenTree.createElement('button', { onclick: () => setState(c => c + 1) }, 'click'),
      )
    );
  }

  //const ttRef = GreenTree.createRef();

  var element = GreenTree.createElement('h1', null, "Hello world!");
  var element1 = () => GreenTree.createElement('h1', { class: 'container' },
    //GreenTree.createElement('div', { class: 'two' }, 'text', 'text2'),
    //GreenTree.createElement('div', { class: 'twosep' }, 'text23'),
    //GreenTree.createElement(Clock, {key: 1}),
    //GreenTree.createElement(Clock, {key: 2}),
    //GreenTree.createElement(Clock, {key: 3}),
    //GreenTree.createElement(function_element, { cust: 123 }),
    // GreenTree.createElement(StateComponent, { t: 1000, dd: 0 }),
    // GreenTree.createElement(StateComponent, { t: 2000, dd: 0 }),
    // GreenTree.createElement(StateComponent, { t: 3000, dd: 0, sd: 1 }),
    //GreenTree.createElement(Route, { url: '/1', t: 1000 }, "1"),
    // GreenTree.createElement(RouteComponent, { url: '/1', t: 1000 }, "1"),
    GreenTree.createElement(RouteComponent, { url: '/2', t: 1000 }, "2"),
    GreenTree.createElement(RouteComponent, { url: '/1', t: 2000 }, "3"),
    GreenTree.createElement(RouteComponent, { url: '/2', t: 1000 }, "4"),
    //GreenTree.createElement(ClassElement, { cust: 456 }),
    //"Text node"
  );
  function Sn({ cur, on, children }) {
    return cur == on ? children : null;
  }
  function SwitchNode() {
    const [state, setState] = GreenTree.useState(1);
    console.debug(">>", state);
    return (
      GreenTree.createElement('h1', { onclick: () => setState(c => c + 1) },
        GreenTree.createElement(Sn, { cur: state, on: 2 }, "2"),
        GreenTree.createElement("span", {}, "3"),
      )
    )
  }
  function Counter() {
    const [state, setState] = GreenTree.useState(1);

    return (
      GreenTree.createElement('h1', {onclick:()=>setState(c => c + 1)},
        state == 1 ? GreenTree.createElement('span', null, "first") : undefined,
        state == 2 ? GreenTree.createElement('span', null, "fsirst") : undefined,
        state == 3 ? GreenTree.createElement('span', null, "ftirst") : undefined,
      )
    )
  }
  //var element2 = GreenTree.createElement(Clock);
  console.debug('VD:', element1);
  //console.debug('Ref:', ttRef);
  GreenTree.Render(GreenTree.createElement(SwitchNode), root);
})();