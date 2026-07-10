package com.bytebite.server.dto;

/** Common fields every item-create payload shares, regardless of its owning resource. */
public interface ItemRequest {
  String name();

  Double quantity();

  String unit();

  String category();
}
