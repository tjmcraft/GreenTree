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
    render() {
      console.warn('>> render', this.state);
      return GreenTree.createElement('div', { class: ['clock', 'sep'] },
        GreenTree.createElement('h1', null, "Node#", this.props.key),
        GreenTree.createElement('h2', null, `${this.state.date}`)
      );
    }
  }

  class ClassElement extends GreenTree.AbstractElement {
    constructor(props) {
      super(props);
      this.refTest = GreenTree.createRef();
    }
    render() {
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
  var element1 = GreenTree.createElement('div', { class: 'container' },
    //GreenTree.createElement('div', { class: 'two' }, 'text', 'text2'),
    //GreenTree.createElement('div', { class: 'twosep' }, 'text23'),
    GreenTree.createElement(Clock, {key: 1}),
    //GreenTree.createElement(Clock, {key: 2}),
    //GreenTree.createElement(Clock, {key: 3}),
    //GreenTree.createElement(function_element, { cust: 123 }),
    GreenTree.createElement(ClassElement, { cust: 456 }),
    //"Text node"
  );
  //var element2 = GreenTree.createElement(Clock);
  console.debug('AltDom:', element1);
  //console.debug('Ref:', ttRef);
  console.debug("Render:", GreenTree.render(element1, root));
})();