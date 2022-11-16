import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Ref,
  ReactNode,
  ReactPortal,
} from 'react';
import { createPortal } from 'react-dom';
import { Control, ControlOptions, DomUtil, DomEvent, Map } from 'leaflet';
import {
  ElementHook,
  LeafletProvider,
  LeafletElement,
  createElementHook,
  LeafletContextInterface,
  createControlHook,
} from '@react-leaflet/core';
import { useMap } from 'react-leaflet';

interface IDumbControl extends Control {}
interface PropsWithChildren {
  children?: ReactNode;
}
interface ControlOptionsWithChildren extends ControlOptions {
  children?: ReactNode;
}

const DumbControl = Control.extend({
  options: {
    className: '',
    onOff: '',
    handleOff: function noop() {},
  },

  onAdd(/* map */) {
    const _controlDiv = DomUtil.create('div', this.options.className);

    DomEvent.on(_controlDiv, 'click', (event) => {
      DomEvent.stopPropagation(event);
    });
    DomEvent.disableScrollPropagation(_controlDiv);
    DomEvent.disableClickPropagation(_controlDiv);

    return _controlDiv;
  },

  onRemove(map: Map) {
    if (this.options.onOff !== '') {
      map.off(this.options.onOff, this.options.handleOff, this);
    }

    return this;
  },
});

const useForceUpdate: () => () => void = () => {
  const [, setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
};

export function createContainerComponent<E, P extends PropsWithChildren>(
  useElement: ElementHook<E, P>,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<E>> {
  function ContainerComponent(props: P, ref: Ref<E>): ReactPortal | null {
    const forceUpdate = useForceUpdate();
    const map = useMap();
    const ctx = { __version: 0, map };
    const { instance, context } = useElement(props, ctx).current;
    const children = props.children;
    const contentNode = (instance as any).getContainer();

    useImperativeHandle(ref, () => instance);
    useEffect(() => {
      forceUpdate();
    }, [contentNode]);

    if (children === undefined || contentNode === undefined) return null;

    return createPortal(<LeafletProvider value={context}>{children}</LeafletProvider>, contentNode);
  }

  return forwardRef(ContainerComponent);
}

export function createControlComponent<E extends Control, P extends ControlOptionsWithChildren>(
  createInstance: (props: P) => E,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<E>> {
  function createElement(props: P, context: LeafletContextInterface): LeafletElement<E> {
    return { instance: createInstance(props), context };
  }
  const useElement = createElementHook(createElement);
  const useControl = createControlHook(useElement);
  return createContainerComponent(useControl);
}

const ReactLeafletControl = createControlComponent<IDumbControl, ControlOptionsWithChildren>(
  function createControlWithChildren(props) {
    return new DumbControl(props);
  },
);

export default ReactLeafletControl;
