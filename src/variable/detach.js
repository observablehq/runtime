export default function variable_detach(input) {
  input._outputs.delete(this);
}
