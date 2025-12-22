export default function DispatchViewModal({ dispatchId, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get(`/kitchen/dispatch-orders/${dispatchId}`)
      .then(r => setData(r.data));
  }, [dispatchId]);

  const dispatch = async () => {
    await API.post(`/kitchen/dispatch-orders/${dispatchId}/dispatch`);
    alert("Dispatched");
    onClose();
  };

  return (
    <Dialog open fullWidth>
      <DialogTitle>Review Dispatch</DialogTitle>

      <DialogContent>
        {/* show branch → item → qty */}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="success" onClick={dispatch}>Dispatch</Button>
      </DialogActions>
    </Dialog>
  );
}
